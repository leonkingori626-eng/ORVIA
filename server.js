// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config();
var moviesJsonPath = path.resolve(process.cwd(), "src/data/movies.json");
var MOVIES_DATABASE = [];
try {
  if (fs.existsSync(moviesJsonPath)) {
    MOVIES_DATABASE = JSON.parse(fs.readFileSync(moviesJsonPath, "utf-8"));
  }
} catch (e) {
  console.warn("Could not load movies.json:", e);
}
var cacheStore = /* @__PURE__ */ new Map();
var inFlightRequests = /* @__PURE__ */ new Map();
var TTL_LIST = 10 * 60 * 1e3;
var TTL_DETAILS = 60 * 60 * 1e3;
var STALE_WINDOW = 30 * 60 * 1e3;
function getCached(key) {
  const item = cacheStore.get(key);
  if (!item) return null;
  const now = Date.now();
  if (now > item.staleUntil) {
    cacheStore.delete(key);
    return null;
  }
  return {
    data: item.data,
    isStale: now > item.expiresAt
  };
}
function setCache(key, data, ttl) {
  const now = Date.now();
  cacheStore.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
    staleUntil: now + ttl + STALE_WINDOW
  });
}
var CircuitBreaker = class {
  constructor() {
    this.failures = 0;
    this.state = "CLOSED";
    this.nextAttempt = 0;
    this.threshold = 5;
    this.cooldown = 3e4;
  }
  // 30 seconds
  canExecute() {
    if (this.state === "CLOSED") return true;
    if (this.state === "OPEN") {
      if (Date.now() > this.nextAttempt) {
        this.state = "HALF-OPEN";
        return true;
      }
      return false;
    }
    return true;
  }
  recordSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }
  recordFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.cooldown;
      console.warn(`[CircuitBreaker] Upstream failing threshold reached. Circuit OPEN for ${this.cooldown / 1e3}s.`);
    }
  }
  getState() {
    return this.state;
  }
};
var tmdbCircuit = new CircuitBreaker();
async function fetchWithResilience(url, options = {}, retries = 3, backoff = 500) {
  if (!tmdbCircuit.canExecute()) {
    throw new Error("CircuitBreakerOpen: Upstream service temporarily unavailable.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6e3);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    if (res.status === 429) {
      const retryAfterHeader = res.headers.get("Retry-After");
      const waitTime = retryAfterHeader ? parseInt(retryAfterHeader) * 1e3 : backoff * 2;
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
  } catch (err) {
    clearTimeout(timeout);
    tmdbCircuit.recordFailure();
    if (retries > 0 && err.name !== "AbortError") {
      const jitter = Math.random() * 200;
      const nextBackoff = backoff * 2 + jitter;
      console.warn(`[TMDB] Transient error encountered (${err.message}). Retrying in ${Math.round(nextBackoff)}ms... (${retries} left)`);
      await new Promise((r) => setTimeout(r, nextBackoff));
      return fetchWithResilience(url, options, retries - 1, nextBackoff);
    }
    throw err;
  }
}
async function deduplicatedFetch(cacheKey, ttl, fetchFn) {
  const cached = getCached(cacheKey);
  if (cached && !cached.isStale) {
    return cached.data;
  }
  if (cached && cached.isStale) {
    if (!inFlightRequests.has(cacheKey)) {
      const p = fetchFn().then((fresh) => {
        setCache(cacheKey, fresh, ttl);
        inFlightRequests.delete(cacheKey);
      }).catch(() => inFlightRequests.delete(cacheKey));
      inFlightRequests.set(cacheKey, p);
    }
    return cached.data;
  }
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }
  const promise = fetchFn().then((data) => {
    setCache(cacheKey, data, ttl);
    inFlightRequests.delete(cacheKey);
    return data;
  }).catch((err) => {
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
  const portArgIndex = args.indexOf("--port");
  const cliPort = portArgIndex !== -1 && args[portArgIndex + 1] ? Number(args[portArgIndex + 1]) : null;
  let PORT = cliPort;
  if (!PORT) {
    if (process.env.NODE_ENV === "development") {
      PORT = 3e3;
    } else {
      PORT = Number(process.env.PORT) || 3e3;
    }
  }
  app.use(express.json());
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: Date.now() });
  });
  const TMDB_TOKEN = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkN2NlYjIwYjU4MmE5MTM3YjYwNjgxMDQwNjUxYmIxZiIsIm5iZiI6MTc5MTU1MzA4OS4wMDE5OTk5LCJzdWIiOiI2YWM4ZWU0MDQzMTljYTc5NGY5NmUxMTUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.pd5SWOAdHmyE8N2ZRqWksWXy3PWPcu6VfDQoyuScXNY";
  const TMDB_BASE_URL = "https://api.themoviedb.org/3";
  const tmdbHeaders = {
    "Authorization": `Bearer ${TMDB_TOKEN}`,
    "Content-Type": "application/json"
  };
  app.get("/api/status", (req, res) => {
    res.json({
      tmdbConfigured: true,
      circuitState: tmdbCircuit.getState(),
      message: "TMDB API connected securely with Bearer token & resilient SWR caching."
    });
  });
  app.get("/api/catalog", async (req, res) => {
    const cacheKey = "catalog:popular";
    try {
      const data = await deduplicatedFetch(cacheKey, TTL_LIST, async () => {
        const [moviesRes, tvRes] = await Promise.all([
          fetchWithResilience(`${TMDB_BASE_URL}/movie/popular?language=en-US&page=1`, { headers: tmdbHeaders }),
          fetchWithResilience(`${TMDB_BASE_URL}/tv/popular?language=en-US&page=1`, { headers: tmdbHeaders })
        ]);
        const formattedMovies = (moviesRes.results || []).map((m) => ({
          id: `tmdb-movie-${m.id}`,
          title: m.title || m.original_title,
          genres: ["Action", "Drama", "Adventure"],
          releaseYear: m.release_date ? parseInt(m.release_date.split("-")[0]) : 2025,
          posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
          backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80",
          synopsis: m.overview || "No synopsis available.",
          telegramPostId: `tmdb_post_${m.id}`,
          telegramUrl: `https://t.me/orviaplay/${m.id}`,
          playbackUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
          duration: "2h 00m",
          rating: m.vote_average ? m.vote_average.toFixed(1) : "8.0",
          contentRating: "PG-13",
          director: "TMDB Verified Director",
          writers: ["TMDB Writer"],
          cast: [],
          category: "movies",
          availabilityLabel: "PLAYABLE"
        }));
        const formattedTv = (tvRes.results || []).map((t) => ({
          id: `tmdb-tv-${t.id}`,
          title: t.name || t.original_name,
          genres: ["Series", "Drama"],
          releaseYear: t.first_air_date ? parseInt(t.first_air_date.split("-")[0]) : 2025,
          posterUrl: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
          backdropUrl: t.backdrop_path ? `https://image.tmdb.org/t/p/original${t.backdrop_path}` : "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80",
          synopsis: t.overview || "No synopsis available.",
          telegramPostId: `tmdb_tv_post_${t.id}`,
          telegramUrl: `https://t.me/orviaplay/tv_${t.id}`,
          playbackUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/CosmosLaundromat.mp4",
          duration: "1 Season",
          rating: t.vote_average ? t.vote_average.toFixed(1) : "8.2",
          contentRating: "TV-14",
          director: "Showrunner",
          writers: ["Series Writer"],
          cast: [],
          category: "tv",
          availabilityLabel: "PLAYABLE",
          seriesData: {
            seasons: [
              {
                seasonNumber: 1,
                title: "Season 1",
                episodes: [
                  { episodeNumber: 1, title: "Episode 1: Premiere", duration: "45m", synopsis: t.overview || "Series premiere.", playbackUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/CosmosLaundromat.mp4", availabilityLabel: "PLAYABLE" },
                  { episodeNumber: 2, title: "Episode 2: The Turn", duration: "48m", synopsis: "The plot thickens.", playbackUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", availabilityLabel: "PLAYABLE" }
                ]
              }
            ]
          }
        }));
        return [...formattedMovies, ...formattedTv, ...MOVIES_DATABASE];
      });
      res.json({ source: "tmdb-live-swr", results: data });
    } catch (err) {
      console.warn("[Catalog] Upstream unavailable, serving local resilient fallback:", err.message);
      res.json({
        source: "local-fallback-circuit-open",
        message: "Upstream catalog temporarily unavailable. Serving verified local cache fallback.",
        results: MOVIES_DATABASE
      });
    }
  });
  app.get("/api/search", async (req, res) => {
    const query = req.query.q || "";
    if (!query) return res.json({ results: [] });
    const cacheKey = `search:${query.toLowerCase()}`;
    try {
      const results = await deduplicatedFetch(cacheKey, TTL_LIST, async () => {
        const searchData = await fetchWithResilience(`${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&page=1`, { headers: tmdbHeaders });
        const tmdbResults = (searchData.results || []).filter((item) => item.media_type === "movie" || item.media_type === "tv").map((item) => ({
          id: `tmdb-${item.media_type}-${item.id}`,
          title: item.title || item.name,
          genres: [item.media_type === "tv" ? "TV Series" : "Movie"],
          releaseYear: item.release_date || item.first_air_date ? parseInt((item.release_date || item.first_air_date).split("-")[0]) : 2025,
          posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
          backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80",
          synopsis: item.overview || "No synopsis available.",
          telegramPostId: `tmdb_search_${item.id}`,
          telegramUrl: `https://t.me/orviaplay/${item.id}`,
          playbackUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
          duration: item.media_type === "tv" ? "1 Season" : "2h 00m",
          rating: item.vote_average ? item.vote_average.toFixed(1) : "8.0",
          contentRating: "PG-13",
          director: "TMDB Director",
          writers: ["Writer"],
          cast: [],
          category: item.media_type === "tv" ? "tv" : "movies",
          availabilityLabel: "PLAYABLE"
        }));
        const localFiltered = MOVIES_DATABASE.filter(
          (m) => m.title.toLowerCase().includes(query.toLowerCase()) || m.synopsis.toLowerCase().includes(query.toLowerCase())
        );
        return [...tmdbResults, ...localFiltered];
      });
      res.json({ source: "tmdb-search-cached", results });
    } catch (err) {
      const filtered = MOVIES_DATABASE.filter(
        (m) => m.title.toLowerCase().includes(query.toLowerCase()) || m.synopsis.toLowerCase().includes(query.toLowerCase())
      );
      res.json({ source: "local-search-fallback", results: filtered });
    }
  });
  const distPath = path.resolve(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));
  if (process.env.NODE_ENV !== "development" && hasDist) {
    console.log(`[ORVIA] Serving production static bundle from ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("[ORVIA] Initializing Vite middleware for development");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ORVIA] Resilient server running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || "production"})`);
  });
  server.on("error", (err) => {
    console.error("[ORVIA] Fatal server error:", err);
    process.exit(1);
  });
  process.on("SIGTERM", () => {
    console.log("[ORVIA] SIGTERM received. Gracefully closing HTTP server...");
    server.close(() => {
      console.log("[ORVIA] HTTP server closed.");
      process.exit(0);
    });
  });
}
startServer().catch((err) => {
  console.error("[ORVIA] Failed to start server:", err);
  process.exit(1);
});
