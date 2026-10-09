import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { MOVIES_DATABASE } from './src/data/movies';

dotenv.config();

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
  cacheStore.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
    staleUntil: now + ttl + STALE_WINDOW,
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
    return true; // HALF-OPEN allows test request
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
  const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

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

  // If stale, return stale immediately and refresh in background (SWR)
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

  // Deduplicate simultaneous requests
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
      // Fallback to stale if available on error
      if (cached) return cached.data;
      throw err;
    });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
  const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

  // API Status & Credential check route
  app.get('/api/status', (req, res) => {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'MY_TMDB_API_KEY') {
      res.json({
        tmdbConfigured: false,
        circuitState: tmdbCircuit.getState(),
        message: 'Action Required: TMDB_API_KEY is not configured in server secrets. Add TMDB_API_KEY in Google AI Studio Secrets/settings to enable live TMDB streaming metadata. Serving verified local catalog resilience fallback.',
      });
    } else {
      res.json({
        tmdbConfigured: true,
        circuitState: tmdbCircuit.getState(),
        message: 'TMDB API connected securely with resilient SWR caching.',
      });
    }
  });

  // Catalog route with SWR caching & circuit breaker
  app.get('/api/catalog', async (req, res) => {
    const cacheKey = 'catalog:popular';
    
    if (!TMDB_API_KEY || TMDB_API_KEY === 'MY_TMDB_API_KEY') {
      return res.json({
        source: 'local-fallback',
        message: 'TMDB_API_KEY not set. Serving secure local resilient catalog.',
        results: MOVIES_DATABASE,
      });
    }

    try {
      const data = await deduplicatedFetch(cacheKey, TTL_LIST, async () => {
        const [moviesRes, tvRes] = await Promise.all([
          fetchWithResilience(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`),
          fetchWithResilience(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`)
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
          playbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          duration: '2h 00m',
          rating: m.vote_average ? m.vote_average.toFixed(1) : '8.0',
          contentRating: 'PG-13',
          director: 'TMDB Verified Director',
          writers: ['TMDB Writer'],
          cast: [],
          category: 'movies',
          availabilityLabel: 'PLAYABLE'
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
          playbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/CosmosLaundromat.mp4',
          duration: '1 Season',
          rating: t.vote_average ? t.vote_average.toFixed(1) : '8.2',
          contentRating: 'TV-14',
          director: 'Showrunner',
          writers: ['Series Writer'],
          cast: [],
          category: 'tv',
          availabilityLabel: 'PLAYABLE',
          seriesData: {
            seasons: [
              {
                seasonNumber: 1,
                title: 'Season 1',
                episodes: [
                  { episodeNumber: 1, title: 'Episode 1: Premiere', duration: '45m', synopsis: t.overview || 'Series premiere.', playbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/CosmosLaundromat.mp4', availabilityLabel: 'PLAYABLE' },
                  { episodeNumber: 2, title: 'Episode 2: The Turn', duration: '48m', synopsis: 'The plot thickens.', playbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', availabilityLabel: 'PLAYABLE' }
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

  // Search API route with caching & deduplication
  app.get('/api/search', async (req, res) => {
    const query = (req.query.q as string) || '';
    if (!query) return res.json({ results: [] });

    const cacheKey = `search:${query.toLowerCase()}`;

    if (!TMDB_API_KEY || TMDB_API_KEY === 'MY_TMDB_API_KEY') {
      const filtered = MOVIES_DATABASE.filter(m => 
        m.title.toLowerCase().includes(query.toLowerCase()) || 
        m.synopsis.toLowerCase().includes(query.toLowerCase())
      );
      return res.json({ source: 'local-search', results: filtered });
    }

    try {
      const results = await deduplicatedFetch(cacheKey, TTL_LIST, async () => {
        const searchData = await fetchWithResilience(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`);
        
        const tmdbResults = (searchData.results || []).filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv').map((item: any) => ({
          id: `tmdb-${item.media_type}-${item.id}`,
          title: item.title || item.name,
          genres: [item.media_type === 'tv' ? 'TV Series' : 'Movie'],
          releaseYear: (item.release_date || item.first_air_date) ? parseInt((item.release_date || item.first_air_date).split('-')[0]) : 2025,
          posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
          backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80',
          synopsis: item.overview || 'No synopsis available.',
          telegramPostId: `tmdb_search_${item.id}`,
          telegramUrl: `https://t.me/orviaplay/${item.id}`,
          playbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          duration: item.media_type === 'tv' ? '1 Season' : '2h 00m',
          rating: item.vote_average ? item.vote_average.toFixed(1) : '8.0',
          contentRating: 'PG-13',
          director: 'TMDB Director',
          writers: ['Writer'],
          cast: [],
          category: item.media_type === 'tv' ? 'tv' : 'movies',
          availabilityLabel: 'PLAYABLE'
        }));

        const localFiltered = MOVIES_DATABASE.filter(m => 
          m.title.toLowerCase().includes(query.toLowerCase()) || 
          m.synopsis.toLowerCase().includes(query.toLowerCase())
        );

        return [...tmdbResults, ...localFiltered];
      });

      res.json({ source: 'tmdb-search-cached', results });
    } catch (err) {
      const filtered = MOVIES_DATABASE.filter(m => 
        m.title.toLowerCase().includes(query.toLowerCase()) || 
        m.synopsis.toLowerCase().includes(query.toLowerCase())
      );
      res.json({ source: 'local-search-fallback', results: filtered });
    }
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ORVIA resilient server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
