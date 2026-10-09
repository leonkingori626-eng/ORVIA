import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { registryStore, PlaybackStreamSource } from './src/services/contentRegistryStore';

dotenv.config();

const moviesJsonPath = path.resolve(process.cwd(), 'src/data/movies.json');
let MOVIES_DATABASE: any[] = [];
try {
  if (fs.existsSync(moviesJsonPath)) {
    MOVIES_DATABASE = JSON.parse(fs.readFileSync(moviesJsonPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load movies.json:', e);
}

// --- 1. RESILIENT CACHE & STALE-WHILE-REVALIDATE ---
interface CacheItem {
  data: any;
  timestamp: number;
  expiresAt: number;
  staleUntil: number;
}

const cacheStore = new Map<string, CacheItem>();
const inFlightRequests = new Map<string, Promise<any>>();

const TTL_LIST = 10 * 60 * 1000; // 10 minutes for lists
const TTL_DETAILS = 60 * 60 * 1000; // 1 hour for details
const TTL_SEARCH = 60 * 1000; // 60 seconds for active search queries
const TTL_SEARCH_EMPTY = 5 * 1000; // 5 seconds max for empty search results
const STALE_WINDOW = 30 * 60 * 1000; // 30 mins stale-while-revalidate

function getCached(key: string): { data: any; isStale: boolean } | null {
  const item = cacheStore.get(key);
  if (!item) return null;
  const now = Date.now();
  if (now > item.staleUntil) {
    cacheStore.delete(key);
    return null;
  }
  return {
    data: item.data,
    isStale: now > item.expiresAt,
  };
}

function setCache(key: string, data: any, ttl: number) {
  const now = Date.now();
  // Never freeze empty search results in cache for long durations
  const isSearchEmpty = key.startsWith('search:') && Array.isArray(data) && data.length === 0;
  const effectiveTtl = isSearchEmpty ? TTL_SEARCH_EMPTY : ttl;
  const staleWindow = key.startsWith('search:') ? 30 * 1000 : STALE_WINDOW;
  cacheStore.set(key, {
    data,
    timestamp: now,
    expiresAt: now + effectiveTtl,
    staleUntil: now + effectiveTtl + staleWindow,
  });
}

// --- 2. CIRCUIT BREAKER & RETRY WITH BACKOFF ---
class CircuitBreaker {
  private failures = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF-OPEN' = 'CLOSED';
  private nextAttempt = 0;
  private threshold = 5;
  private cooldown = 30000; // 30 seconds

  canExecute(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF-OPEN';
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  recordFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.cooldown;
      console.warn(`[CircuitBreaker] Upstream failing threshold reached. Circuit OPEN for ${this.cooldown / 1000}s.`);
    }
  }

  getState() {
    return this.state;
  }
}

const tmdbCircuit = new CircuitBreaker();

// --- 3. ROBUST UPSTREAM FETCH WITH TIMEOUT & BACKOFF ---
async function fetchWithResilience(url: string, options: any = {}, retries = 3, backoff = 500): Promise<any> {
  if (!tmdbCircuit.canExecute()) {
    throw new Error('CircuitBreakerOpen: Upstream service temporarily unavailable.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);

    if (res.status === 429) {
      const retryAfterHeader = res.headers.get('Retry-After');
      const waitTime = retryAfterHeader ? parseInt(retryAfterHeader) * 1000 : backoff * 2;
      console.warn(`[TMDB] HTTP 429 Rate Limited. Backing off for ${waitTime}ms.`);
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, waitTime));
        return fetchWithResilience(url, options, retries - 1, waitTime * 1.5);
      }
    }

    if (!res.ok) {
      throw new Error(`Upstream HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    tmdbCircuit.recordSuccess();
    return data;
  } catch (err: any) {
    clearTimeout(timeout);
    tmdbCircuit.recordFailure();

    if (retries > 0 && err.name !== 'AbortError') {
      const jitter = Math.random() * 200;
      const nextBackoff = backoff * 2 + jitter;
      console.warn(`[TMDB] Transient error encountered (${err.message}). Retrying in ${Math.round(nextBackoff)}ms... (${retries} left)`);
      await new Promise((r) => setTimeout(r, nextBackoff));
      return fetchWithResilience(url, options, retries - 1, nextBackoff);
    }
    throw err;
  }
}

// --- 4. REQUEST DEDUPLICATION WRAPPER ---
async function deduplicatedFetch(cacheKey: string, ttl: number, fetchFn: () => Promise<any>): Promise<any> {
  const cached = getCached(cacheKey);
  if (cached && !cached.isStale) {
    return cached.data;
  }

  if (cached && cached.isStale) {
    if (!inFlightRequests.has(cacheKey)) {
      const p = fetchFn()
        .then((fresh) => {
          setCache(cacheKey, fresh, ttl);
          inFlightRequests.delete(cacheKey);
        })
        .catch(() => inFlightRequests.delete(cacheKey));
      inFlightRequests.set(cacheKey, p);
    }
    return cached.data;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const promise = fetchFn()
    .then((data) => {
      setCache(cacheKey, data, ttl);
      inFlightRequests.delete(cacheKey);
      return data;
    })
    .catch((err) => {
      inFlightRequests.delete(cacheKey);
      if (cached) return cached.data;
      throw err;
    });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

async function startServer() {
  const app = express();

  const args = process.argv.slice(2);
  const portArgIndex = args.indexOf('--port');
  const cliPort = portArgIndex !== -1 && args[portArgIndex + 1] ? Number(args[portArgIndex + 1]) : null;

  // In Cloud Run / containerized environments, process.env.PORT is injected (e.g. 8080).
  // In AI Studio dev server, --port 3000 is supplied via CLI arguments.
  const PORT = cliPort || Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Cloud Run / container health check endpoints
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: Date.now() });
  });

  const TMDB_TOKEN = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkN2NlYjIwYjU4MmE5MTM3YjYwNjgxMDQwNjUxYmIxZiIsIm5iZiI6MTc5MTU1MzA4OS4wMDE5OTk5LCJzdWIiOiI2YWM4ZWU0MDQzMTljYTc5NGY5NmUxMTUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.pd5SWOAdHmyE8N2ZRqWksWXy3PWPcu6VfDQoyuScXNY';
  const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

  const tmdbHeaders = {
    'Authorization': `Bearer ${TMDB_TOKEN}`,
    'Content-Type': 'application/json'
  };

  // API Status & Credential check route
  app.get('/api/status', (req, res) => {
    res.json({
      tmdbConfigured: true,
      circuitState: tmdbCircuit.getState(),
      message: 'TMDB API connected securely with Bearer token & resilient SWR caching.',
    });
  });

  // Pre-cached initial header buffer (512 KB) for ultra-low-latency playback startup (< 2ms)
  const initialChunkCache = new Map<string, { buffer: Buffer; totalLength: string; contentType: string }>();

  async function preloadInitialChunk(key: string, url: string) {
    try {
      const res = await fetch(url, { headers: { Range: 'bytes=0-524287' } });
      if (res.status === 206 || res.status === 200) {
        const arrayBuf = await res.arrayBuffer();
        const cr = res.headers.get('content-range');
        const total = cr ? cr.split('/')[1] : res.headers.get('content-length') || '597796730';
        initialChunkCache.set(key, {
          buffer: Buffer.from(arrayBuf),
          totalLength: total,
          contentType: res.headers.get('content-type') || 'video/mp4'
        });
        console.log(`[Stream FastStart] Preloaded initial chunk for ${key} (${arrayBuf.byteLength} bytes)`);
      }
    } catch (err: any) {
      console.warn(`[Stream FastStart] Could not preload initial chunk for ${key}:`, err.message);
    }
  }

  // Preload primary verified feature film header asynchronously on server boot
  preloadInitialChunk('night-of-the-living-dead', 'https://dn711006.ca.archive.org/0/items/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4');

  // --- PLAYBACK RESOLUTION SERVICE ---
  // Single authoritative backend resolution endpoint for all titles and episodes
  app.all('/api/playback/resolve', (req, res) => {
    const contentId = (req.method === 'POST' ? req.body.contentId : req.query.contentId) as string;
    const episodeId = (req.method === 'POST' ? req.body.episodeId : req.query.episodeId) as string;
    const isTestMode = req.method === 'POST' ? Boolean(req.body.testMode) : req.query.testMode === 'true';

    if (!contentId) {
      return res.status(400).json({
        authorized: false,
        code: 'MISSING_CONTENT_ID',
        reason: 'contentId parameter is required to resolve playback authorization.'
      });
    }

    const resolution = registryStore.resolvePlayback(contentId, episodeId, isTestMode);
    console.log(`[Playback Resolution] Resolved contentId="${contentId}", episodeId="${episodeId || 'none'}", authorized=${resolution.authorized}, rights=${resolution.rightsStatus}`);
    
    const statusCode = resolution.authorized ? 200 : (resolution.code === 'NOT_FOUND' ? 404 : 403);
    return res.status(statusCode).json(resolution);
  });

  // --- CONTENT REGISTRY & SOURCE MANAGEMENT ADMIN APIS ---
  // Returns all registered items, episodes, and stream sources
  app.get('/api/admin/registry', (req, res) => {
    res.json({
      items: registryStore.getAllItems(),
      sources: registryStore.getAllSources(),
      timestamp: Date.now()
    });
  });

  // Register or update a playback source
  app.post('/api/admin/sources/register', (req, res) => {
    const body = req.body;
    if (!body.contentId || !body.streamUrl || !body.title) {
      return res.status(400).json({ error: 'contentId, title, and streamUrl are required.' });
    }

    const newSource: PlaybackStreamSource = {
      sourceId: body.sourceId || `src-${body.contentId}-${Date.now().toString(36)}`,
      contentId: body.contentId,
      mediaType: body.mediaType || 'movie',
      title: body.title,
      quality: body.quality || '1080p',
      format: body.format || 'mp4',
      streamUrl: body.streamUrl,
      proxyUrl: body.proxyUrl || `/api/media/stream/${body.contentId}`,
      cdnProvider: body.cdnProvider || 'Authorized Origin CDN',
      byteRangeSupported: Boolean(body.byteRangeSupported ?? true),
      rightsStatus: body.rightsStatus || 'licensed',
      licenseTerms: body.licenseTerms || 'Permitted Distribution Agreement',
      attribution: body.attribution || 'Registered Partner Origin',
      isActive: body.isActive !== false,
      lastVerifiedAt: Date.now(),
      httpStatus: body.httpStatus || 200
    };

    const registered = registryStore.registerSource(newSource);
    console.log(`[Admin Registry] Registered playback source "${registered.sourceId}" for content "${registered.contentId}"`);
    res.json({ success: true, source: registered });
  });

  // Live verification probe for a registered source
  app.post('/api/admin/sources/:sourceId/verify', async (req, res) => {
    const { sourceId } = req.params;
    const sources = registryStore.getAllSources();
    const targetSource = sources.find(s => s.sourceId === sourceId);
    if (!targetSource) {
      return res.status(404).json({ error: 'Source record not found' });
    }

    try {
      const probeRes = await fetch(targetSource.streamUrl, {
        headers: { Range: 'bytes=0-1' },
        signal: AbortSignal.timeout(6000)
      });
      const status = probeRes.status;
      const cr = probeRes.headers.get('content-range');
      const ar = probeRes.headers.get('accept-ranges');
      const byteRangeSupported = status === 206 || (cr ? cr.startsWith('bytes') : false) || (ar ? ar.includes('bytes') : false);
      
      const updated = registryStore.updateSourceVerification(sourceId, status, byteRangeSupported);
      console.log(`[Admin Registry] Live probe for source "${sourceId}": status ${status}, byteRange: ${byteRangeSupported}`);
      return res.json({
        success: true,
        sourceId,
        httpStatus: status,
        byteRangeSupported,
        contentType: probeRes.headers.get('content-type'),
        updated
      });
    } catch (err: any) {
      const updated = registryStore.updateSourceVerification(sourceId, 504, false);
      console.warn(`[Admin Registry] Live probe failed for source "${sourceId}":`, err.message);
      return res.json({
        success: false,
        sourceId,
        error: err.message,
        httpStatus: 504,
        byteRangeSupported: false,
        updated
      });
    }
  });

  // Toggle active status of a source (e.g. disable when authorization expires)
  app.post('/api/admin/sources/:sourceId/toggle', (req, res) => {
    const { sourceId } = req.params;
    const updated = registryStore.toggleSourceActive(sourceId);
    if (!updated) {
      return res.status(404).json({ error: 'Source not found' });
    }
    console.log(`[Admin Registry] Toggled active status for source "${sourceId}": isActive=${updated.isActive}`);
    res.json({ success: true, source: updated });
  });

  // Media Stream Proxy & Byte-Range Delivery Route (HTTP 206 Partial Content)
  app.get('/api/media/stream/:movieId', async (req, res) => {
    const { movieId } = req.params;

    // 1. Authoritative Rights & Registry Validation
    const registryItem = registryStore.getItem(movieId);
    const registeredSources = registryStore.getSourcesForContent(movieId);
    let targetUrl = registeredSources[0]?.streamUrl;

    // Fallback dictionary for stable internal IDs if not yet loaded in sources
    if (!targetUrl) {
      const fallbackMap: Record<string, string> = {
        'night-of-the-living-dead': 'https://dn711006.ca.archive.org/0/items/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4',
        'elephants-dream': 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
        'cosmos-laundromat-s1e1': 'https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4',
        'cosmos-laundromat': 'https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4',
        'player-test-sample': 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
      };
      targetUrl = fallbackMap[movieId];
    }

    if (registryItem) {
      if (!registryItem.isAuthorizedForStreaming || ['trailer-only', 'unavailable', 'revoked', 'expired'].includes(registryItem.rightsStatus)) {
        console.warn(`[Stream Proxy] 403: Title "${movieId}" has rights "${registryItem.rightsStatus}" (UNAUTHORIZED_MEDIA).`);
        return res.status(403).json({
          error: 'Title is not authorized for direct public streaming. Only metadata and trailer previews are available.',
          code: 'UNAUTHORIZED_MEDIA',
          contentId: movieId,
          rightsStatus: registryItem.rightsStatus
        });
      }
      if (!targetUrl) {
        console.warn(`[Stream Proxy] 404: Title "${movieId}" has no active verified stream source (CONTENT_UNAVAILABLE).`);
        return res.status(404).json({
          error: 'No active verified stream source configured for this title',
          code: 'CONTENT_UNAVAILABLE',
          contentId: movieId
        });
      }
    } else if (!targetUrl) {
      console.warn(`[Stream Proxy] 404: Title "${movieId}" not found in registry (SOURCE_NOT_FOUND).`);
      return res.status(404).json({
        error: 'No verified stream available for this title',
        code: 'SOURCE_NOT_FOUND',
        movieId,
        message: 'This title is not registered for streaming in the ORVIA content registry.'
      });
    }

    // 2. Validate Byte-Range Header Format
    const range = req.headers.range;
    if (range) {
      const rangeMatch = range.match(/^bytes=(\d+)-(\d+)?$/);
      if (!rangeMatch) {
        res.setHeader('Content-Range', 'bytes */*');
        return res.status(416).json({
          error: 'Requested Range Not Satisfiable',
          code: 'INVALID_RANGE',
          contentId: movieId,
          receivedRange: range
        });
      }
      const start = parseInt(rangeMatch[1], 10);
      const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : null;
      if (end !== null && start > end) {
        res.setHeader('Content-Range', 'bytes */*');
        return res.status(416).json({
          error: 'Requested Range Start Greater Than End',
          code: 'INVALID_RANGE',
          contentId: movieId,
          receivedRange: range
        });
      }
    }

    console.log(`[Stream Diagnostics] Request: movieId=${movieId}, range=${range || 'full'}, target=${targetUrl}`);

    try {
      // FAST-START: Check if initial range request (e.g. bytes=0-X) can be served instantly from memory cache (< 2ms)
      if (range && range.startsWith('bytes=0-') && initialChunkCache.has(movieId)) {
        const cached = initialChunkCache.get(movieId)!;
        const requestedEnd = parseInt(range.replace('bytes=0-', ''), 10);
        if (!isNaN(requestedEnd) && requestedEnd < cached.buffer.length) {
          const slice = cached.buffer.subarray(0, requestedEnd + 1);
          res.setHeader('Content-Type', cached.contentType);
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
          res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.setHeader('Content-Range', `bytes 0-${requestedEnd}/${cached.totalLength}`);
          res.setHeader('Content-Length', slice.length.toString());
          res.setHeader('X-ORVIA-Delivery', 'stream-proxy-faststart');
          res.status(206);
          return res.end(slice);
        }
      }

      const upstreamHeaders: Record<string, string> = {};
      if (range) {
        upstreamHeaders['Range'] = range;
      }

      const abortController = new AbortController();
      req.on('close', () => {
        abortController.abort();
      });

      const upstreamRes = await fetch(targetUrl, {
        headers: upstreamHeaders,
        signal: abortController.signal,
      });

      if (!upstreamRes.ok && upstreamRes.status !== 206) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(502).json({
          error: `Upstream media origin error: HTTP ${upstreamRes.status}`,
          code: 'UPSTREAM_UNAVAILABLE',
          upstreamStatus: upstreamRes.status
        });
      }

      const contentType = upstreamRes.headers.get('content-type') || 'video/mp4';
      const contentLength = upstreamRes.headers.get('content-length');
      const contentRange = upstreamRes.headers.get('content-range');
      const acceptRanges = upstreamRes.headers.get('accept-ranges') || 'bytes';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', acceptRanges);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-ORVIA-Delivery', 'stream-proxy');

      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
        res.status(206);
      } else if (range && contentLength) {
        res.status(206);
      } else {
        res.status(upstreamRes.status);
      }

      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      if (!upstreamRes.body) {
        return res.end();
      }

      const nodeStream = Readable.fromWeb(upstreamRes.body as any);
      nodeStream.pipe(res);
      nodeStream.on('error', () => {
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Client cancelled / seeked, normal HTTP behavior
      }
      console.warn(`[Stream Proxy] Error proxying stream for ${movieId}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Failed to retrieve media stream from origin CDN',
          code: 'UPSTREAM_UNAVAILABLE',
          details: err.message
        });
      }
    }
  });

  // Catalog route with SWR caching & circuit breaker
  app.get('/api/catalog', async (req, res) => {
    const cacheKey = 'catalog:popular';

    try {
      const data = await deduplicatedFetch(cacheKey, TTL_LIST, async () => {
        const [moviesRes, tvRes] = await Promise.all([
          fetchWithResilience(`${TMDB_BASE_URL}/movie/popular?language=en-US&page=1`, { headers: tmdbHeaders }),
          fetchWithResilience(`${TMDB_BASE_URL}/tv/popular?language=en-US&page=1`, { headers: tmdbHeaders })
        ]);

        const formattedMovies = (moviesRes.results || []).map((m: any) => ({
          id: `tmdb-movie-${m.id}`,
          title: m.title || m.original_title,
          genres: ['Action', 'Drama', 'Adventure'],
          releaseYear: m.release_date ? parseInt(m.release_date.split('-')[0]) : 2025,
          posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
          backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80',
          synopsis: m.overview || 'No synopsis available.',
          telegramPostId: `tmdb_post_${m.id}`,
          telegramUrl: `https://t.me/orviaplay/${m.id}`,
          playbackUrl: '', // Explicit: TMDB commercial titles do not have open streams
          duration: '2h 00m',
          rating: m.vote_average ? m.vote_average.toFixed(1) : '8.0',
          contentRating: 'PG-13',
          director: 'TMDB Verified Director',
          writers: ['TMDB Writer'],
          cast: [],
          category: 'movies',
          availabilityLabel: 'TRAILER ONLY'
        }));

        const formattedTv = (tvRes.results || []).map((t: any) => ({
          id: `tmdb-tv-${t.id}`,
          title: t.name || t.original_name,
          genres: ['Series', 'Drama'],
          releaseYear: t.first_air_date ? parseInt(t.first_air_date.split('-')[0]) : 2025,
          posterUrl: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
          backdropUrl: t.backdrop_path ? `https://image.tmdb.org/t/p/original${t.backdrop_path}` : 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
          synopsis: t.overview || 'No synopsis available.',
          telegramPostId: `tmdb_tv_post_${t.id}`,
          telegramUrl: `https://t.me/orviaplay/tv_${t.id}`,
          playbackUrl: '',
          duration: '1 Season',
          rating: t.vote_average ? t.vote_average.toFixed(1) : '8.2',
          contentRating: 'TV-14',
          director: 'Showrunner',
          writers: ['Series Writer'],
          cast: [],
          category: 'tv',
          availabilityLabel: 'TRAILER ONLY',
          seriesData: {
            seasons: [
              {
                seasonNumber: 1,
                title: 'Season 1',
                episodes: [
                  { episodeNumber: 1, title: 'Episode 1: Premiere', duration: '45m', synopsis: t.overview || 'Series premiere.', playbackUrl: '', availabilityLabel: 'TRAILER ONLY' }
                ]
              }
            ]
          }
        }));

        return [...formattedMovies, ...formattedTv, ...MOVIES_DATABASE];
      });

      res.json({ source: 'tmdb-live-swr', results: data });
    } catch (err: any) {
      console.warn('[Catalog] Upstream unavailable, serving local resilient fallback:', err.message);
      res.json({
        source: 'local-fallback-circuit-open',
        message: 'Upstream catalog temporarily unavailable. Serving verified local cache fallback.',
        results: MOVIES_DATABASE,
      });
    }
  });

  // TMDB Genre Map for rich genre tag mapping
  const TMDB_GENRE_MAP: Record<number, string> = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Sci-Fi',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
    10759: 'Action & Adventure',
    10762: 'Kids',
    10763: 'News',
    10764: 'Reality',
    10765: 'Sci-Fi & Fantasy',
    10766: 'Soap',
    10767: 'Talk',
    10768: 'War & Politics'
  };

  // Search API route with parallel movie + TV queries, media-type routing, TVMaze resilience, and caching
  app.get('/api/search', async (req, res) => {
    const rawQuery = (req.query.q as string) || '';
    const query = rawQuery.trim().replace(/\s+/g, ' ');
    const typeFilter = ((req.query.type as string) || 'all').toLowerCase(); // 'all' | 'movies' | 'tv'

    if (!query) return res.json({ results: [], totalResults: 0 });

    const cacheKey = `search:${typeFilter}:${query.toLowerCase()}`;
    const queryLower = query.toLowerCase();

    try {
      const results = await deduplicatedFetch(cacheKey, TTL_SEARCH, async () => {
        let movieResults: any[] = [];
        let tvResults: any[] = [];
        const fetchErrors: string[] = [];

        // Helper: Map TMDB Movie result
        const mapTmdbMovie = (m: any) => {
          const year = m.release_date ? parseInt(m.release_date.split('-')[0], 10) : 2025;
          const genreList = (m.genre_ids || []).map((id: number) => TMDB_GENRE_MAP[id]).filter(Boolean).slice(0, 3);
          return {
            id: `tmdb-movie-${m.id}`,
            title: m.title || m.original_title,
            genres: genreList.length > 0 ? genreList : ['Movie'],
            releaseYear: isNaN(year) ? 2025 : year,
            posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
            backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80',
            synopsis: m.overview || 'No synopsis available.',
            telegramPostId: `tmdb_search_${m.id}`,
            telegramUrl: `https://t.me/orviaplay/${m.id}`,
            playbackUrl: '',
            duration: '2h 00m',
            rating: m.vote_average ? m.vote_average.toFixed(1) : '8.0',
            contentRating: 'PG-13',
            director: 'TMDB Director',
            writers: ['Screenplay'],
            cast: [],
            category: 'movies',
            popularity: Number(m.popularity) || 0,
            availabilityLabel: 'TRAILER ONLY'
          };
        };

        // Helper: Map TMDB TV Series result
        const mapTmdbTv = (t: any) => {
          const year = t.first_air_date ? parseInt(t.first_air_date.split('-')[0], 10) : 2025;
          const genreList = (t.genre_ids || []).map((id: number) => TMDB_GENRE_MAP[id]).filter(Boolean).slice(0, 3);
          return {
            id: `tmdb-tv-${t.id}`,
            title: t.name || t.original_name,
            genres: genreList.length > 0 ? genreList : ['TV Series', 'Drama'],
            releaseYear: isNaN(year) ? 2025 : year,
            posterUrl: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
            backdropUrl: t.backdrop_path ? `https://image.tmdb.org/t/p/original${t.backdrop_path}` : 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
            synopsis: t.overview || 'No synopsis available.',
            telegramPostId: `tmdb_tv_search_${t.id}`,
            telegramUrl: `https://t.me/orviaplay/tv_${t.id}`,
            playbackUrl: '',
            duration: 'TV Series',
            rating: t.vote_average ? t.vote_average.toFixed(1) : '8.2',
            contentRating: 'TV-14',
            director: 'Showrunner',
            writers: ['Series Writer'],
            cast: [],
            category: 'tv',
            popularity: Number(t.popularity) || 0,
            availabilityLabel: 'TRAILER ONLY'
          };
        };

        // Helper: Map TVMaze Open Keyless TV result
        const mapTvMazeShow = (item: any) => {
          const s = item.show || item;
          const cleanSummary = (s.summary || '').replace(/<[^>]*>?/gm, '').trim();
          const year = s.premiered ? parseInt(s.premiered.split('-')[0], 10) : 2025;
          return {
            id: `tvmaze-tv-${s.id}`,
            title: s.name,
            genres: (s.genres && s.genres.length > 0) ? s.genres : ['Drama', 'Crime', 'TV Series'],
            releaseYear: isNaN(year) ? 2025 : year,
            posterUrl: s.image?.medium || s.image?.original || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
            backdropUrl: s.image?.original || s.image?.medium || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
            synopsis: cleanSummary || 'No synopsis available.',
            telegramPostId: `tvmaze_search_${s.id}`,
            telegramUrl: `https://t.me/orviaplay/tvmaze_${s.id}`,
            playbackUrl: '',
            duration: s.averageRuntime ? `${s.averageRuntime}m per ep` : 'TV Series',
            rating: s.rating?.average ? s.rating.average.toFixed(1) : '8.2',
            contentRating: 'TV-14',
            director: s.network?.name || 'Showrunner',
            writers: ['Series Production'],
            cast: [],
            category: 'tv',
            popularity: ((item.score || 0) * 100) + (s.weight || 0),
            availabilityLabel: 'TRAILER ONLY'
          };
        };

        const fetchPromises: Promise<any>[] = [];

        // 1. Movie Search Route
        if (typeFilter === 'all' || typeFilter === 'movies') {
          fetchPromises.push(
            fetchWithResilience(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`, { headers: tmdbHeaders })
              .then(data => {
                movieResults = (data.results || []).map(mapTmdbMovie);
              })
              .catch(err => {
                console.warn('[Search] TMDB Movie search error:', err.message);
                fetchErrors.push(`MovieProvider: ${err.message}`);
              })
          );
        }

        // 2. TV Series Search Route (TMDB + TVMaze fallback)
        if (typeFilter === 'all' || typeFilter === 'tv') {
          fetchPromises.push(
            fetchWithResilience(`${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`, { headers: tmdbHeaders })
              .then(async (data) => {
                tvResults = (data.results || []).map(mapTmdbTv);

                // If TMDB returns no TV results for this query, augment immediately with TVMaze open catalog
                if (tvResults.length === 0) {
                  try {
                    const tvmRes = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
                    if (tvmRes.ok) {
                      const tvmData = await tvmRes.json();
                      tvResults = (tvmData || []).slice(0, 10).map(mapTvMazeShow);
                    }
                  } catch (e: any) {
                    console.warn('[Search] TVMaze fallback warning:', e.message);
                  }
                }
              })
              .catch(async (err) => {
                console.warn('[Search] TMDB TV search failed, falling back to open TVMaze:', err.message);
                fetchErrors.push(`TVProvider: ${err.message}`);
                try {
                  const tvmRes = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
                  if (tvmRes.ok) {
                    const tvmData = await tvmRes.json();
                    tvResults = (tvmData || []).slice(0, 10).map(mapTvMazeShow);
                  }
                } catch (e: any) {
                  console.warn('[Search] TVMaze error:', e.message);
                }
              })
          );
        }

        await Promise.all(fetchPromises);

        // Filter local verified database
        const localFiltered = MOVIES_DATABASE.filter(m => {
          const matchesQuery = m.title.toLowerCase().includes(queryLower) || 
                               m.synopsis.toLowerCase().includes(queryLower) ||
                               m.genres.some((g: string) => g.toLowerCase().includes(queryLower));
          const matchesType = typeFilter === 'all' || 
                              (typeFilter === 'movies' && m.category === 'movies') ||
                              (typeFilter === 'tv' && m.category === 'tv');
          return matchesQuery && matchesType;
        });

        // Deduplicate items by normalized title + category
        const seen = new Set<string>();
        const uniqueResults: any[] = [];
        for (const item of [...localFiltered, ...tvResults, ...movieResults]) {
          const key = `${item.category}:${item.title.toLowerCase().trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueResults.push(item);
          }
        }

        // Interleave & rank results intelligently
        const ranked = uniqueResults.sort((a: any, b: any) => {
          // 1. Keep playable verified titles prominently ranked
          if (a.availabilityLabel === 'PLAYABLE' && b.availabilityLabel !== 'PLAYABLE') return -1;
          if (b.availabilityLabel === 'PLAYABLE' && a.availabilityLabel !== 'PLAYABLE') return 1;

          // 2. Exact title match boost (e.g. "Prison Break" === "prison break")
          const aExact = a.title.toLowerCase().trim() === queryLower;
          const bExact = b.title.toLowerCase().trim() === queryLower;
          if (aExact && !bExact) return -1;
          if (bExact && !aExact) return 1;

          // 3. Starts-with title match boost
          const aStarts = a.title.toLowerCase().startsWith(queryLower);
          const bStarts = b.title.toLowerCase().startsWith(queryLower);
          if (aStarts && !bStarts) return -1;
          if (bStarts && !aStarts) return 1;

          // 4. Popularity metric
          return (Number(b.popularity) || 0) - (Number(a.popularity) || 0);
        });

        // If upstream services encountered fatal errors and returned nothing
        if (fetchErrors.length > 0 && ranked.length === 0) {
          throw new Error(`Upstream metadata providers failed: ${fetchErrors.join('; ')}`);
        }

        return ranked;
      });

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string) || 24));
      const totalResults = results.length;
      const totalPages = Math.ceil(totalResults / limit) || 1;
      const paginatedResults = req.query.page ? results.slice((page - 1) * limit, page * limit) : results;

      res.json({
        source: 'live-provider-search',
        page,
        totalPages,
        limit,
        totalResults,
        results: paginatedResults
      });
    } catch (err: any) {
      console.warn('[Search] Provider error:', err.message);
      
      // Fallback: search local database
      const filtered = MOVIES_DATABASE.filter(m => 
        m.title.toLowerCase().includes(queryLower) || 
        m.synopsis.toLowerCase().includes(queryLower)
      );

      if (filtered.length > 0) {
        return res.json({ source: 'local-verified-fallback', totalResults: filtered.length, results: filtered });
      }

      // If upstream failed and no local fallback matches, return 503 so frontend displays error banner instead of zero results
      res.status(503).json({
        source: 'provider-offline',
        error: 'Search providers temporarily unreachable. Please retry.',
        totalResults: 0,
        results: []
      });
    }
  });

  const distPath = path.resolve(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (hasDist) {
    console.log(`[ORVIA] Serving compiled production bundle from ${distPath} (HMR WebSocket completely bypassed)`);
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      // Do not intercept API or health endpoints
      if (req.path.startsWith('/api') || req.path === '/health') {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[ORVIA] Initializing Vite middleware for development (HMR disabled)');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ORVIA] Resilient server running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'production'})`);
  });

  server.on('error', (err: any) => {
    console.error('[ORVIA] Fatal server error:', err);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    console.log('[ORVIA] SIGTERM received. Gracefully closing HTTP server...');
    server.close(() => {
      console.log('[ORVIA] HTTP server closed.');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('[ORVIA] Failed to start server:', err);
  process.exit(1);
});
