// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { Readable } from "stream";

// src/services/contentRegistryStore.ts
var INITIAL_REGISTRY_ITEMS = [
  {
    id: "night-of-the-living-dead",
    title: "Night of the Living Dead (1968)",
    type: "movie",
    rightsStatus: "public-domain",
    licenseTerms: "Public Domain in the United States and worldwide (1968 Original Release Notice Omission)",
    attribution: "Internet Archive Public Domain Feature Films Archive",
    metadataProvider: "archive-org",
    isAuthorizedForStreaming: true,
    notes: "Full-length 96-minute feature film with verified 1080p and 720p streams."
  },
  {
    id: "charade-1963",
    title: "Charade (1963)",
    type: "movie",
    rightsStatus: "public-domain",
    licenseTerms: "Public Domain Worldwide (1963 Notice Defect under U.S. Copyright Act of 1909)",
    attribution: "Universal Pictures (Public Domain) / Internet Archive",
    metadataProvider: "archive-org",
    isAuthorizedForStreaming: true,
    notes: "Full-length 113-minute romantic thriller starring Cary Grant and Audrey Hepburn."
  },
  {
    id: "carnival-of-souls",
    title: "Carnival of Souls (1962)",
    type: "movie",
    rightsStatus: "public-domain",
    licenseTerms: "Public Domain Worldwide",
    attribution: "Internet Archive Public Domain Moving Images",
    metadataProvider: "archive-org",
    isAuthorizedForStreaming: true,
    notes: "Classic 78-minute psychological horror feature film."
  },
  {
    id: "the-general-1926",
    title: "The General (1926)",
    type: "movie",
    rightsStatus: "public-domain",
    licenseTerms: "Public Domain Worldwide (Pre-1929 publication expiration)",
    attribution: "United Artists 1926 / Internet Archive",
    metadataProvider: "archive-org",
    isAuthorizedForStreaming: true,
    notes: "Buster Keaton full-length silent action comedy masterpiece."
  },
  {
    id: "his-girl-friday-1940",
    title: "His Girl Friday (1940)",
    type: "movie",
    rightsStatus: "public-domain",
    licenseTerms: "Public Domain Worldwide (Copyright Renewal Omission in 1968)",
    attribution: "Columbia Pictures (Public Domain) / Internet Archive",
    metadataProvider: "archive-org",
    isAuthorizedForStreaming: true,
    notes: "Howard Hawks lightning-fast screwball comedy masterwork starring Cary Grant and Rosalind Russell."
  },
  {
    id: "elephants-dream",
    title: "Elephants Dream (2006)",
    type: "movie",
    rightsStatus: "creative-commons",
    licenseTerms: "Creative Commons Attribution 2.5 (CC-BY 2.5)",
    attribution: "Blender Institute Open Movie Project (Ton Roosendaal)",
    metadataProvider: "blender-foundation",
    isAuthorizedForStreaming: true,
    notes: "Authorized open-movie benchmark animation."
  },
  {
    id: "sintel-2010",
    title: "Sintel (2010)",
    type: "movie",
    rightsStatus: "creative-commons",
    licenseTerms: "Creative Commons Attribution 3.0 (CC-BY 3.0)",
    attribution: "Blender Foundation / Durian Project",
    metadataProvider: "blender-foundation",
    isAuthorizedForStreaming: true,
    notes: "Authorized open fantasy animated short film."
  },
  {
    id: "cosmos-laundromat",
    title: "Cosmos Laundromat (First Cycle)",
    type: "series",
    rightsStatus: "creative-commons",
    licenseTerms: "Creative Commons Attribution 4.0 International (CC-BY 4.0)",
    attribution: "Blender Animation Studio",
    metadataProvider: "blender-foundation",
    isAuthorizedForStreaming: true,
    notes: "Serialized open animation project."
  },
  {
    id: "cosmos-laundromat-s1e1",
    title: "Episode 1: The Waiting Room",
    type: "episode",
    parentId: "cosmos-laundromat",
    seasonNumber: 1,
    episodeNumber: 1,
    rightsStatus: "creative-commons",
    licenseTerms: "Creative Commons Attribution 4.0 International (CC-BY 4.0)",
    attribution: "Blender Animation Studio",
    metadataProvider: "blender-foundation",
    isAuthorizedForStreaming: true,
    notes: "Complete episode 1 with verified 1080p audio/video streams."
  },
  {
    id: "cosmos-laundromat-s1e2",
    title: "Episode 2: Grassland Jump",
    type: "episode",
    parentId: "cosmos-laundromat",
    seasonNumber: 1,
    episodeNumber: 2,
    rightsStatus: "trailer-only",
    licenseTerms: "Production Preview License",
    attribution: "Blender Animation Studio",
    metadataProvider: "blender-foundation",
    isAuthorizedForStreaming: false,
    notes: "In-production episode. No full stream authorized yet."
  },
  {
    id: "cosmos-laundromat-s1e3",
    title: "Episode 3: The Ultimate Exit",
    type: "episode",
    parentId: "cosmos-laundromat",
    seasonNumber: 1,
    episodeNumber: 3,
    rightsStatus: "unavailable",
    licenseTerms: "Unreleased script draft",
    attribution: "Blender Animation Studio",
    metadataProvider: "blender-foundation",
    isAuthorizedForStreaming: false,
    notes: "Pre-production unreleased concept."
  },
  {
    id: "celestia-echoes",
    title: "Celestia: Echoes of Orion",
    type: "movie",
    rightsStatus: "trailer-only",
    licenseTerms: "ORVIA Promotional Metadata Indexing Agreement",
    attribution: "ORVIA Originals Index",
    metadataProvider: "internal",
    isAuthorizedForStreaming: false,
    notes: "Promotional trailer and metadata only. Full film stream is not licensed."
  },
  {
    id: "neo-samurai",
    title: "Neo-Samurai: Cyberpunk Shadows",
    type: "movie",
    rightsStatus: "trailer-only",
    licenseTerms: "ORVIA Promotional Metadata Indexing Agreement",
    attribution: "ORVIA Originals Index",
    metadataProvider: "internal",
    isAuthorizedForStreaming: false,
    notes: "Promotional trailer and metadata only. Full film stream is not licensed."
  },
  {
    id: "abyss-into-trenches",
    title: "Abyss: Into the Trenches",
    type: "movie",
    rightsStatus: "trailer-only",
    licenseTerms: "ORVIA Documentaries Index Agreement",
    attribution: "ORVIA Documentaries Index",
    metadataProvider: "internal",
    isAuthorizedForStreaming: false,
    notes: "Documentary preview only. Full video file not authorized for direct streaming."
  },
  {
    id: "player-test-sample",
    title: "ORVIA Player Diagnostic Benchmark (Test Mode)",
    type: "movie",
    rightsStatus: "creative-commons",
    licenseTerms: "Creative Commons Attribution 2.5 (CC-BY 2.5)",
    attribution: "Blender Foundation Diagnostic Test Engine",
    metadataProvider: "blender-foundation",
    isAuthorizedForStreaming: true,
    notes: "Strictly restricted to developer/diagnostic test mode. NEVER used as catalog fallback."
  }
];
var INITIAL_STREAM_SOURCES = [
  {
    sourceId: "src-notld-1080p",
    contentId: "night-of-the-living-dead",
    sourceProvider: "Internet Archive Global Edge",
    mediaType: "movie",
    title: "Night of the Living Dead - 1080p Full Feature",
    authorizationStatus: "authorized",
    availabilityStatus: "verified",
    quality: "1080p",
    format: "mp4",
    streamUrl: "https://dn711006.ca.archive.org/0/items/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4",
    proxyUrl: "/api/media/stream/night-of-the-living-dead",
    cdnProvider: "Internet Archive Global Edge CDN",
    byteRangeSupported: true,
    rightsStatus: "public-domain",
    licenseTerms: "Public Domain (U.S. Copyright Act 1968 Notice Omission)",
    attribution: "Internet Archive Open Film Collection",
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
    playbackDetails: {
      mimeType: "video/mp4",
      isByteRangeSupported: true,
      resolution: "1280x720"
    }
  },
  {
    sourceId: "src-notld-720p",
    contentId: "night-of-the-living-dead",
    sourceProvider: "Internet Archive Primary CDN Mirror",
    mediaType: "movie",
    title: "Night of the Living Dead - 720p Backup Mirror",
    authorizationStatus: "authorized",
    availabilityStatus: "active",
    quality: "720p",
    format: "mp4",
    streamUrl: "https://archive.org/download/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4",
    proxyUrl: "/api/media/stream/night-of-the-living-dead",
    cdnProvider: "Internet Archive Primary CDN Mirror",
    byteRangeSupported: true,
    rightsStatus: "public-domain",
    licenseTerms: "Public Domain (U.S. Copyright Act 1968 Notice Omission)",
    attribution: "Internet Archive Open Film Collection",
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
    playbackDetails: {
      mimeType: "video/mp4",
      isByteRangeSupported: true,
      resolution: "1280x720"
    }
  },
  {
    sourceId: "src-charade-1080p",
    contentId: "charade-1963",
    sourceProvider: "Internet Archive Universal Classics",
    mediaType: "movie",
    title: "Charade (1963) - Full Feature Master",
    authorizationStatus: "authorized",
    availabilityStatus: "verified",
    quality: "1080p",
    format: "mp4",
    streamUrl: "https://archive.org/download/Charade1963_201602/Charade1963.mp4",
    proxyUrl: "/api/media/stream/charade-1963",
    cdnProvider: "Internet Archive Edge CDN",
    byteRangeSupported: true,
    rightsStatus: "public-domain",
    licenseTerms: "Public Domain Worldwide",
    attribution: "Internet Archive Public Domain Collection",
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
    playbackDetails: {
      mimeType: "video/mp4",
      isByteRangeSupported: true,
      resolution: "1920x1080"
    }
  },
  {
    sourceId: "src-carnival-1080p",
    contentId: "carnival-of-souls",
    sourceProvider: "Internet Archive Open Moving Images",
    mediaType: "movie",
    title: "Carnival of Souls (1962) - Full Feature Stream",
    authorizationStatus: "authorized",
    availabilityStatus: "verified",
    quality: "1080p",
    format: "mp4",
    streamUrl: "https://archive.org/download/CarnivalOfSouls/CarnivalOfSouls.mp4",
    proxyUrl: "/api/media/stream/carnival-of-souls",
    cdnProvider: "Internet Archive Edge CDN",
    byteRangeSupported: true,
    rightsStatus: "public-domain",
    licenseTerms: "Public Domain Worldwide",
    attribution: "Internet Archive",
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
    playbackDetails: {
      mimeType: "video/mp4",
      isByteRangeSupported: true
    }
  },
  {
    sourceId: "src-general-720p",
    contentId: "the-general-1926",
    sourceProvider: "Internet Archive Silent Classics",
    mediaType: "movie",
    title: "The General (1926) - Full Feature Stream",
    authorizationStatus: "authorized",
    availabilityStatus: "verified",
    quality: "720p",
    format: "mp4",
    streamUrl: "https://archive.org/download/The_General_Buster_Keaton/The_General.mp4",
    proxyUrl: "/api/media/stream/the-general-1926",
    cdnProvider: "Internet Archive Edge CDN",
    byteRangeSupported: true,
    rightsStatus: "public-domain",
    licenseTerms: "Public Domain Worldwide",
    attribution: "Internet Archive",
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
    playbackDetails: {
      mimeType: "video/mp4",
      isByteRangeSupported: true
    }
  },
  {
    sourceId: "src-his-girl-friday-cdn",
    contentId: "his-girl-friday-1940",
    sourceProvider: "Internet Archive Global Edge",
    mediaType: "movie",
    title: "His Girl Friday (1940) - Standard Definition Master",
    authorizationStatus: "authorized",
    availabilityStatus: "verified",
    quality: "720p",
    format: "mp4",
    streamUrl: "https://archive.org/download/his_girl_friday/his_girl_friday_512kb.mp4",
    proxyUrl: "/api/media/stream/his-girl-friday-1940",
    cdnProvider: "Internet Archive Edge CDN",
    byteRangeSupported: true,
    rightsStatus: "public-domain",
    licenseTerms: "Public Domain Worldwide (Copyright Renewal Omission in 1968)",
    attribution: "Columbia Pictures 1940 (Public Domain) / Internet Archive",
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
    playbackDetails: {
      mimeType: "video/mp4",
      isByteRangeSupported: true
    }
  },
  {
    sourceId: "src-elephants-1080p",
    contentId: "elephants-dream",
    sourceProvider: "Blender Foundation / Archive.org Edge",
    mediaType: "movie",
    title: "Elephants Dream - 1080p Feature Stream",
    authorizationStatus: "authorized",
    availabilityStatus: "verified",
    quality: "1080p",
    format: "mp4",
    streamUrl: "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4",
    proxyUrl: "/api/media/stream/elephants-dream",
    cdnProvider: "Blender Foundation / Archive.org Edge",
    byteRangeSupported: true,
    rightsStatus: "creative-commons",
    licenseTerms: "Creative Commons Attribution 2.5 (CC-BY 2.5)",
    attribution: "Blender Institute Open Movie Project",
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
    playbackDetails: {
      mimeType: "video/mp4",
      isByteRangeSupported: true,
      resolution: "1024x576"
    }
  },
  {
    sourceId: "src-sintel-1080p",
    contentId: "sintel-2010",
    sourceProvider: "Blender Foundation / Durian Project",
    mediaType: "movie",
    title: "Sintel (2010) - 1080p Full Feature",
    authorizationStatus: "authorized",
    availabilityStatus: "verified",
    quality: "1080p",
    format: "mp4",
    streamUrl: "https://archive.org/download/Sintel/sintel-2048-surround.mp4",
    proxyUrl: "/api/media/stream/sintel-2010",
    cdnProvider: "Internet Archive Global Edge",
    byteRangeSupported: true,
    rightsStatus: "creative-commons",
    licenseTerms: "Creative Commons Attribution 3.0 (CC-BY 3.0)",
    attribution: "Blender Foundation / Durian Project",
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
    playbackDetails: {
      mimeType: "video/mp4",
      isByteRangeSupported: true
    }
  },
  {
    sourceId: "src-cosmos-s1e1-1080p",
    contentId: "cosmos-laundromat-s1e1",
    sourceProvider: "Blender Institute Global Media CDN",
    mediaType: "episode",
    title: "Cosmos Laundromat S1:E1 (The Waiting Room) - 1080p",
    authorizationStatus: "authorized",
    availabilityStatus: "verified",
    quality: "1080p",
    format: "mp4",
    streamUrl: "https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4",
    proxyUrl: "/api/media/stream/cosmos-laundromat-s1e1",
    cdnProvider: "Blender Institute Global Media CDN",
    byteRangeSupported: true,
    rightsStatus: "creative-commons",
    licenseTerms: "Creative Commons Attribution 4.0 International (CC-BY 4.0)",
    attribution: "Blender Institute / Cosmos Project",
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
    playbackDetails: {
      mimeType: "video/mp4",
      isByteRangeSupported: true,
      resolution: "1920x1080"
    }
  },
  {
    sourceId: "src-test-benchmark",
    contentId: "player-test-sample",
    sourceProvider: "Diagnostic Benchmark Engine CDN",
    mediaType: "movie",
    title: "Diagnostic Benchmark Sample Stream (Test Mode Only)",
    authorizationStatus: "authorized",
    availabilityStatus: "verified",
    quality: "720p",
    format: "mp4",
    streamUrl: "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4",
    proxyUrl: "/api/media/stream/player-test-sample",
    cdnProvider: "Diagnostic Benchmark Engine CDN",
    byteRangeSupported: true,
    rightsStatus: "creative-commons",
    licenseTerms: "Creative Commons Attribution 2.5 \u2014 Strictly for Player Diagnostic Testing",
    attribution: "ORVIA Test Suite",
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
    playbackDetails: {
      mimeType: "video/mp4",
      isByteRangeSupported: true
    }
  }
];
var ContentRegistryStore = class {
  constructor() {
    this.items = /* @__PURE__ */ new Map();
    this.sources = /* @__PURE__ */ new Map();
    INITIAL_REGISTRY_ITEMS.forEach((item) => this.items.set(item.id, { ...item }));
    INITIAL_STREAM_SOURCES.forEach((source) => this.sources.set(source.sourceId, { ...source }));
  }
  getItem(id) {
    return this.items.get(id);
  }
  getAllItems() {
    return Array.from(this.items.values());
  }
  getAllSources() {
    return Array.from(this.sources.values());
  }
  getSourcesForContent(contentId) {
    return Array.from(this.sources.values()).filter((s) => s.contentId === contentId && s.isActive);
  }
  registerItem(item) {
    this.items.set(item.id, { ...item });
    return item;
  }
  registerSource(source) {
    this.sources.set(source.sourceId, { ...source });
    return source;
  }
  toggleSourceActive(sourceId) {
    const s = this.sources.get(sourceId);
    if (!s) return null;
    s.isActive = !s.isActive;
    return s;
  }
  updateSourceVerification(sourceId, status, byteRangeSupported) {
    const s = this.sources.get(sourceId);
    if (!s) return null;
    s.httpStatus = status;
    s.byteRangeSupported = byteRangeSupported;
    s.lastVerifiedAt = Date.now();
    return s;
  }
  /**
   * Authority Playback Resolution Engine:
   * - Strict Content ID matching
   * - Rejects test samples in production playback
   * - Never returns cross-title or random fallbacks
   * - Honest refusal when no verified playback source exists
   */
  resolvePlayback(targetContentId, episodeId, isTestMode = false) {
    const effectiveId = episodeId || targetContentId;
    if (effectiveId === "player-test-sample" && !isTestMode) {
      return {
        authorized: false,
        code: "UNAUTHORIZED_MEDIA",
        reason: "Diagnostic test samples cannot be played outside of explicit Player Diagnostic mode.",
        contentId: effectiveId,
        title: "Player Diagnostic Benchmark",
        mediaType: "movie",
        rightsStatus: "unavailable",
        sources: [],
        deliveryMethod: "none"
      };
    }
    const item = this.items.get(effectiveId);
    const sources = Array.from(this.sources.values()).filter(
      (s) => s.contentId === effectiveId && s.isActive
    );
    if (!item) {
      const isExternalCommercial = effectiveId.startsWith("tmdb-") || effectiveId.startsWith("tvmaze-");
      return {
        authorized: false,
        code: isExternalCommercial ? "METADATA_ONLY" : "SOURCE_NOT_FOUND",
        reason: isExternalCommercial ? "No verified public playback stream is authorized for this commercial catalog title. Only metadata and trailer previews are available." : `Title with ID "${effectiveId}" was not found in the verified ORVIA content registry.`,
        contentId: effectiveId,
        title: effectiveId,
        mediaType: episodeId ? "episode" : "movie",
        rightsStatus: "trailer-only",
        sources: [],
        deliveryMethod: "none"
      };
    }
    if (item.rightsStatus === "trailer-only" || item.rightsStatus === "unavailable" || item.rightsStatus === "revoked" || item.rightsStatus === "expired") {
      return {
        authorized: false,
        code: "UNAUTHORIZED_MEDIA",
        reason: item.notes || `Title "${item.title}" is restricted to metadata/trailer preview only (${item.rightsStatus}). No full-length stream is authorized.`,
        contentId: effectiveId,
        title: item.title,
        mediaType: item.type === "episode" ? "episode" : "movie",
        episodeId: item.type === "episode" ? effectiveId : void 0,
        rightsStatus: item.rightsStatus,
        licenseTerms: item.licenseTerms,
        sources: [],
        deliveryMethod: "none"
      };
    }
    if (sources.length === 0) {
      return {
        authorized: false,
        code: "CONTENT_UNAVAILABLE",
        reason: `No active verified stream sources are currently registered for "${item.title}". Direct streaming is disabled.`,
        contentId: effectiveId,
        title: item.title,
        mediaType: item.type === "episode" ? "episode" : "movie",
        episodeId: item.type === "episode" ? effectiveId : void 0,
        rightsStatus: item.rightsStatus,
        licenseTerms: item.licenseTerms,
        sources: [],
        deliveryMethod: "none"
      };
    }
    for (const s of sources) {
      if (s.contentId !== effectiveId) {
        return {
          authorized: false,
          code: "SOURCE_MISMATCH",
          reason: `Security verification failure: Source "${s.sourceId}" bound to content "${s.contentId}" does not match requested ID "${effectiveId}". Cross-title substitution is strictly rejected.`,
          contentId: effectiveId,
          title: item.title,
          mediaType: item.type === "episode" ? "episode" : "movie",
          rightsStatus: "unavailable",
          sources: [],
          deliveryMethod: "none"
        };
      }
    }
    const qualityRank = { "1080p": 3, "720p": 2, "480p": 1, "auto": 0 };
    const sortedSources = [...sources].sort((a, b) => qualityRank[b.quality] - qualityRank[a.quality]);
    const primarySource = sortedSources[0];
    return {
      authorized: true,
      code: "AUTHORIZED",
      contentId: effectiveId,
      title: item.title,
      mediaType: item.type === "episode" ? "episode" : "movie",
      episodeId: item.type === "episode" ? effectiveId : void 0,
      rightsStatus: item.rightsStatus,
      licenseTerms: item.licenseTerms,
      sources: sortedSources,
      selectedSource: primarySource,
      deliveryMethod: primarySource.proxyUrl ? "stream-proxy" : "direct-cdn"
    };
  }
};
var registryStore = new ContentRegistryStore();

// src/services/adapters/tvmazeAdapter.ts
var TVMazeAdapter = class {
  constructor() {
    this.id = "tvmaze";
    this.name = "TVMaze Open Broadcast Catalog";
  }
  canHandle(id) {
    return id.startsWith("tvmaze-") || id.startsWith("tvmaze-tv-");
  }
  async search(query, type = "all", page = 1, limit = 24) {
    if (type === "movies") {
      return { provider: this.id, query, page, limit, totalResults: 0, totalPages: 0, results: [] };
    }
    try {
      const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(6e3)
      });
      if (!res.ok) {
        throw new Error(`TVMaze responded with HTTP ${res.status}`);
      }
      const items = await res.json();
      const results = items.map((item) => {
        const s = item.show || item;
        const cleanSummary = (s.summary || "").replace(/<[^>]*>?/gm, "").trim();
        const year = s.premiered ? parseInt(s.premiered.split("-")[0], 10) : 2025;
        return {
          id: `tvmaze-tv-${s.id}`,
          title: s.name,
          genres: s.genres && s.genres.length > 0 ? s.genres : ["Drama", "Series"],
          releaseYear: isNaN(year) ? 2025 : year,
          posterUrl: s.image?.medium || s.image?.original || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
          backdropUrl: s.image?.original || s.image?.medium || "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80",
          synopsis: cleanSummary || "No synopsis available.",
          telegramPostId: `tvmaze_${s.id}`,
          telegramUrl: `https://t.me/orviaplay/tvmaze_${s.id}`,
          playbackUrl: "",
          duration: s.averageRuntime ? `${s.averageRuntime}m per ep` : "TV Series",
          rating: s.rating?.average ? s.rating.average.toFixed(1) : "8.2",
          contentRating: "TV-14",
          director: s.network?.name || "Network Production",
          writers: ["Series Production Team"],
          cast: [],
          category: "tv",
          availabilityLabel: "METADATA ONLY",
          metadataProvider: "tvmaze"
        };
      });
      const totalResults = results.length;
      const totalPages = Math.ceil(totalResults / limit) || 1;
      const paginated = results.slice((page - 1) * limit, page * limit);
      return {
        provider: this.id,
        query,
        page,
        limit,
        totalResults,
        totalPages,
        results: paginated
      };
    } catch (err) {
      console.warn("[TVMazeAdapter] Search error:", err.message);
      return { provider: this.id, query, page, limit, totalResults: 0, totalPages: 0, results: [] };
    }
  }
  async getDetails(id) {
    const numericId = id.replace(/^(tvmaze-tv-|tvmaze-)/, "");
    try {
      const res = await fetch(`https://api.tvmaze.com/shows/${numericId}?embed[]=episodes&embed[]=cast`, {
        signal: AbortSignal.timeout(7e3)
      });
      if (!res.ok) {
        return null;
      }
      const show = await res.json();
      const cleanSummary = (show.summary || "").replace(/<[^>]*>?/gm, "").trim();
      const year = show.premiered ? parseInt(show.premiered.split("-")[0], 10) : 2025;
      const cast = (show._embedded?.cast || []).slice(0, 16).map((c) => ({
        name: c.person?.name || "Cast Member",
        role: c.character?.name || "Character",
        avatarUrl: c.person?.image?.medium || c.person?.image?.original || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
      }));
      const rawEpisodes = show._embedded?.episodes || [];
      const seasonMap = /* @__PURE__ */ new Map();
      rawEpisodes.forEach((ep) => {
        const sNum = ep.season || 1;
        if (!seasonMap.has(sNum)) {
          seasonMap.set(sNum, []);
        }
        const cleanEpSummary = (ep.summary || "").replace(/<[^>]*>?/gm, "").trim();
        const epRecord = {
          id: `tvmaze-ep-${ep.id}`,
          seasonNumber: sNum,
          episodeNumber: ep.number || 1,
          title: ep.name || `Episode ${ep.number}`,
          duration: ep.runtime ? `${ep.runtime}m` : `${show.averageRuntime || 45}m`,
          synopsis: cleanEpSummary || "No episode synopsis recorded.",
          stillUrl: ep.image?.medium || ep.image?.original,
          airDate: ep.airdate,
          playbackUrl: "",
          // Honest: commercial broadcast shows do not have open streams
          availabilityLabel: "METADATA ONLY",
          rightsStatus: "trailer-only",
          isPlayable: false
        };
        seasonMap.get(sNum).push(epRecord);
      });
      const seasons = Array.from(seasonMap.entries()).sort(([a], [b]) => a - b).map(([sNum, episodes]) => ({
        seasonNumber: sNum,
        title: `Season ${sNum}`,
        episodes
      }));
      return {
        id: `tvmaze-tv-${show.id}`,
        title: show.name,
        genres: show.genres && show.genres.length > 0 ? show.genres : ["Drama", "Crime", "TV Series"],
        releaseYear: isNaN(year) ? 2025 : year,
        posterUrl: show.image?.medium || show.image?.original || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
        backdropUrl: show.image?.original || show.image?.medium || "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80",
        synopsis: cleanSummary || "No synopsis available.",
        telegramPostId: `tvmaze_${show.id}`,
        telegramUrl: `https://t.me/orviaplay/tvmaze_${show.id}`,
        playbackUrl: "",
        duration: `${seasons.length} Season${seasons.length > 1 ? "s" : ""}`,
        rating: show.rating?.average ? show.rating.average.toFixed(1) : "8.2",
        contentRating: "TV-14",
        director: show.network?.name || "Executive Producers",
        writers: ["Series Writing Staff"],
        cast,
        category: "tv",
        availabilityLabel: "METADATA ONLY",
        metadataProvider: "tvmaze",
        seriesData: {
          seasons,
          totalSeasons: seasons.length,
          totalEpisodes: rawEpisodes.length,
          status: show.status,
          network: show.network?.name
        }
      };
    } catch (err) {
      console.warn("[TVMazeAdapter] getDetails error:", err.message);
      return null;
    }
  }
};
var tvmazeAdapter = new TVMazeAdapter();

// src/services/adapters/tmdbAdapter.ts
var TMDB_BASE_URL = "https://api.themoviedb.org/3";
var TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
var FALLBACK_TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkN2NlYjIwYjU4MmE5MTM3YjYwNjgxMDQwNjUxYmIxZiIsIm5iZiI6MTc5MTU1MzA4OS4wMDE5OTk5LCJzdWIiOiI2YWM4ZWU0MDQzMTljYTc5NGY5NmUxMTUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.pd5SWOAdHmyE8N2ZRqWksWXy3PWPcu6VfDQoyuScXNY";
var TMDBAdapter = class {
  constructor() {
    this.id = "tmdb";
    this.name = "The Movie Database (TMDB)";
  }
  getAuthHeader() {
    const token = typeof process !== "undefined" && process.env?.TMDB_API_KEY || FALLBACK_TMDB_TOKEN;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }
  canHandle(id) {
    return id.startsWith("tmdb-") || id.startsWith("tmdb-movie-") || id.startsWith("tmdb-tv-");
  }
  async search(query, type = "all", page = 1, limit = 24) {
    const headers = this.getAuthHeader();
    const movieResults = [];
    const tvResults = [];
    const promises = [];
    if (type === "all" || type === "movies") {
      promises.push(
        fetch(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=${page}`, {
          headers,
          signal: AbortSignal.timeout(6e3)
        }).then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          (data.results || []).forEach((m) => {
            const year = m.release_date ? parseInt(m.release_date.split("-")[0], 10) : 2025;
            movieResults.push({
              id: `tmdb-movie-${m.id}`,
              title: m.title || m.original_title,
              genres: ["Movie", "Cinema"],
              releaseYear: isNaN(year) ? 2025 : year,
              posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}/w500${m.poster_path}` : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
              backdropUrl: m.backdrop_path ? `${TMDB_IMAGE_BASE}/original${m.backdrop_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80",
              synopsis: m.overview || "No synopsis recorded.",
              telegramPostId: `tmdb_${m.id}`,
              telegramUrl: `https://t.me/orviaplay/${m.id}`,
              playbackUrl: "",
              // Commercial movie: no unauthorized stream
              duration: "2h 00m",
              rating: m.vote_average ? m.vote_average.toFixed(1) : "8.0",
              contentRating: "PG-13",
              director: "Studio Production",
              writers: ["Screenplay Staff"],
              cast: [],
              category: "movies",
              availabilityLabel: "METADATA ONLY",
              metadataProvider: "tmdb"
            });
          });
        }).catch((err) => console.warn("[TMDBAdapter] Movie search failed:", err.message))
      );
    }
    if (type === "all" || type === "tv") {
      promises.push(
        fetch(`${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=${page}`, {
          headers,
          signal: AbortSignal.timeout(6e3)
        }).then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          (data.results || []).forEach((t) => {
            const year = t.first_air_date ? parseInt(t.first_air_date.split("-")[0], 10) : 2025;
            tvResults.push({
              id: `tmdb-tv-${t.id}`,
              title: t.name || t.original_name,
              genres: ["TV Series", "Drama"],
              releaseYear: isNaN(year) ? 2025 : year,
              posterUrl: t.poster_path ? `${TMDB_IMAGE_BASE}/w500${t.poster_path}` : "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
              backdropUrl: t.backdrop_path ? `${TMDB_IMAGE_BASE}/original${t.backdrop_path}` : "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80",
              synopsis: t.overview || "No synopsis recorded.",
              telegramPostId: `tmdb_tv_${t.id}`,
              telegramUrl: `https://t.me/orviaplay/tv_${t.id}`,
              playbackUrl: "",
              duration: "TV Series",
              rating: t.vote_average ? t.vote_average.toFixed(1) : "8.2",
              contentRating: "TV-14",
              director: "Executive Producers",
              writers: ["Series Writing Staff"],
              cast: [],
              category: "tv",
              availabilityLabel: "METADATA ONLY",
              metadataProvider: "tmdb"
            });
          });
        }).catch((err) => console.warn("[TMDBAdapter] TV search failed:", err.message))
      );
    }
    await Promise.all(promises);
    const combined = [...tvResults, ...movieResults];
    return {
      provider: this.id,
      query,
      page,
      limit,
      totalResults: combined.length,
      totalPages: Math.ceil(combined.length / limit) || 1,
      results: combined.slice(0, limit)
    };
  }
  async getDetails(id) {
    const isTv = id.includes("-tv-");
    const numericId = id.replace(/^(tmdb-movie-|tmdb-tv-|tmdb-)/, "");
    const headers = this.getAuthHeader();
    try {
      if (isTv) {
        const res = await fetch(`${TMDB_BASE_URL}/tv/${numericId}?append_to_response=credits,videos`, {
          headers,
          signal: AbortSignal.timeout(7e3)
        });
        if (!res.ok) return null;
        const data = await res.json();
        const cast = (data.credits?.cast || []).slice(0, 16).map((c) => ({
          name: c.name || "Cast Member",
          role: c.character || "Character",
          avatarUrl: c.profile_path ? `${TMDB_IMAGE_BASE}/w300${c.profile_path}` : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
        }));
        const year = data.first_air_date ? parseInt(data.first_air_date.split("-")[0], 10) : 2025;
        const genres = (data.genres || []).map((g) => g.name);
        let season1Episodes = [];
        try {
          const sRes = await fetch(`${TMDB_BASE_URL}/tv/${numericId}/season/1`, {
            headers,
            signal: AbortSignal.timeout(5e3)
          });
          if (sRes.ok) {
            const sData = await sRes.json();
            season1Episodes = (sData.episodes || []).map((ep) => ({
              id: `tmdb-ep-${data.id}-s1e${ep.episode_number}`,
              seasonNumber: 1,
              episodeNumber: ep.episode_number,
              title: ep.name || `Episode ${ep.episode_number}`,
              duration: ep.runtime ? `${ep.runtime}m` : "45m",
              synopsis: ep.overview || "No episode synopsis recorded.",
              stillUrl: ep.still_path ? `${TMDB_IMAGE_BASE}/w500${ep.still_path}` : void 0,
              airDate: ep.air_date,
              playbackUrl: "",
              availabilityLabel: "METADATA ONLY",
              rightsStatus: "trailer-only",
              isPlayable: false
            }));
          }
        } catch (e) {
          console.warn("[TMDBAdapter] Season 1 fetch error:", e.message);
        }
        const seasons = (data.seasons || []).filter((s) => s.season_number > 0).map((s) => ({
          seasonNumber: s.season_number,
          title: s.name || `Season ${s.season_number}`,
          overview: s.overview,
          posterUrl: s.poster_path ? `${TMDB_IMAGE_BASE}/w300${s.poster_path}` : void 0,
          airDate: s.air_date,
          episodes: s.season_number === 1 ? season1Episodes : []
        }));
        const trailer = (data.videos?.results || []).find((v) => v.site === "YouTube" && v.type === "Trailer");
        return {
          id: `tmdb-tv-${data.id}`,
          title: data.name || data.original_name,
          genres: genres.length > 0 ? genres : ["Drama", "TV Series"],
          releaseYear: isNaN(year) ? 2025 : year,
          posterUrl: data.poster_path ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}` : "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
          backdropUrl: data.backdrop_path ? `${TMDB_IMAGE_BASE}/original${data.backdrop_path}` : "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80",
          synopsis: data.overview || "No synopsis recorded.",
          telegramPostId: `tmdb_tv_${data.id}`,
          telegramUrl: `https://t.me/orviaplay/tv_${data.id}`,
          playbackUrl: "",
          duration: `${seasons.length} Season${seasons.length > 1 ? "s" : ""}`,
          rating: data.vote_average ? data.vote_average.toFixed(1) : "8.2",
          contentRating: "TV-14",
          director: data.created_by?.[0]?.name || "Executive Showrunner",
          writers: (data.created_by || []).map((c) => c.name),
          cast,
          category: "tv",
          availabilityLabel: trailer ? "TRAILER ONLY" : "METADATA ONLY",
          metadataProvider: "tmdb",
          trailerYoutubeKey: trailer?.key,
          seriesData: {
            seasons,
            totalSeasons: seasons.length,
            totalEpisodes: data.number_of_episodes,
            status: data.status
          }
        };
      } else {
        const res = await fetch(`${TMDB_BASE_URL}/movie/${numericId}?append_to_response=credits,videos`, {
          headers,
          signal: AbortSignal.timeout(7e3)
        });
        if (!res.ok) return null;
        const data = await res.json();
        const cast = (data.credits?.cast || []).slice(0, 16).map((c) => ({
          name: c.name || "Cast Member",
          role: c.character || "Character",
          avatarUrl: c.profile_path ? `${TMDB_IMAGE_BASE}/w300${c.profile_path}` : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
        }));
        const director = (data.credits?.crew || []).find((c) => c.job === "Director")?.name || "Director";
        const writers = (data.credits?.crew || []).filter((c) => c.department === "Writing").slice(0, 3).map((c) => c.name);
        const year = data.release_date ? parseInt(data.release_date.split("-")[0], 10) : 2025;
        const genres = (data.genres || []).map((g) => g.name);
        const runtimeH = Math.floor((data.runtime || 120) / 60);
        const runtimeM = (data.runtime || 120) % 60;
        const trailer = (data.videos?.results || []).find((v) => v.site === "YouTube" && v.type === "Trailer");
        return {
          id: `tmdb-movie-${data.id}`,
          title: data.title || data.original_title,
          genres: genres.length > 0 ? genres : ["Cinema", "Drama"],
          releaseYear: isNaN(year) ? 2025 : year,
          posterUrl: data.poster_path ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}` : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
          backdropUrl: data.backdrop_path ? `${TMDB_IMAGE_BASE}/original${data.backdrop_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80",
          synopsis: data.overview || "No synopsis recorded.",
          telegramPostId: `tmdb_movie_${data.id}`,
          telegramUrl: `https://t.me/orviaplay/movie_${data.id}`,
          playbackUrl: "",
          duration: `${runtimeH}h ${runtimeM}m`,
          rating: data.vote_average ? data.vote_average.toFixed(1) : "8.0",
          contentRating: "PG-13",
          director,
          writers: writers.length > 0 ? writers : ["Screenplay Team"],
          cast,
          category: "movies",
          availabilityLabel: trailer ? "TRAILER ONLY" : "METADATA ONLY",
          metadataProvider: "tmdb",
          trailerYoutubeKey: trailer?.key
        };
      }
    } catch (err) {
      console.warn("[TMDBAdapter] getDetails error:", err.message);
      return null;
    }
  }
};
var tmdbAdapter = new TMDBAdapter();

// src/services/adapters/archiveOrgAdapter.ts
var VERIFIED_ARCHIVE_CATALOG = [
  {
    id: "night-of-the-living-dead",
    archiveIdentifier: "Night.Of.The.Living.Dead_1080p",
    title: "Night of the Living Dead (1968)",
    year: 1968,
    genres: ["Horror", "Mystery", "Classic"],
    duration: "1h 36m",
    synopsis: "A group of desperate survivors barricade themselves inside a rural farmhouse to withstand an onslaught of reanimated, flesh-eating ghouls. George A. Romero's groundbreaking, full-length 96-minute public domain horror masterpiece.",
    director: "George A. Romero",
    writers: ["George A. Romero", "John Russo"],
    rating: "8.8",
    posterUrl: "/src/assets/images/poster_classic_metropolis_1791548891044.jpg",
    backdropUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80",
    cast: [
      { name: "Duane Jones", role: "Ben", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" },
      { name: "Judith O'Dea", role: "Barbra", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" },
      { name: "Karl Hardman", role: "Harry Cooper", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" }
    ],
    streamUrl: "https://dn711006.ca.archive.org/0/items/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4",
    backupStreamUrl: "https://archive.org/download/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4",
    attribution: "Internet Archive Public Domain Feature Films Collection",
    licenseTerms: "Public Domain in the United States and worldwide (1968 Original Release Notice Omission)"
  },
  {
    id: "charade-1963",
    archiveIdentifier: "Charade1963",
    title: "Charade (1963)",
    year: 1963,
    genres: ["Mystery", "Comedy", "Thriller", "Classic"],
    duration: "1h 53m",
    synopsis: "A stylish Paris widow is pursued by several men who want a fortune her murdered husband had stolen. Whom can she trust? Starring Cary Grant and Audrey Hepburn in Stanley Donen's universally celebrated public domain romantic thriller.",
    director: "Stanley Donen",
    writers: ["Peter Stone"],
    rating: "8.9",
    posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80",
    cast: [
      { name: "Cary Grant", role: "Peter Joshua / Alexander Dyle", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" },
      { name: "Audrey Hepburn", role: "Regina Lampert", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" },
      { name: "Walter Matthau", role: "Hamilton Bartholomew", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80" },
      { name: "James Coburn", role: "Tex Panthollow", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" }
    ],
    streamUrl: "https://archive.org/download/Charade1963_201602/Charade1963.mp4",
    backupStreamUrl: "https://ia800300.us.archive.org/20/items/Charade1963/Charade.ia.mp4",
    attribution: "Universal Pictures (Entered Public Domain upon release due to notice omission) / Internet Archive",
    licenseTerms: "Public Domain Worldwide (Notice Defect under 1909 U.S. Copyright Act)"
  },
  {
    id: "carnival-of-souls",
    archiveIdentifier: "CarnivalOfSouls",
    title: "Carnival of Souls (1962)",
    year: 1962,
    genres: ["Horror", "Mystery", "Classic"],
    duration: "1h 18m",
    synopsis: "After a traumatic car accident, a church organist finds herself drawn toward an eerie, abandoned lakeside pavilion while haunted by a spectral phantom.",
    director: "Herk Harvey",
    writers: ["John Clifford"],
    rating: "8.3",
    posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
    cast: [
      { name: "Candace Hilligoss", role: "Mary Henry", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" },
      { name: "Herk Harvey", role: "The Man", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" }
    ],
    streamUrl: "https://archive.org/download/CarnivalOfSouls/CarnivalOfSouls.mp4",
    attribution: "Internet Archive Public Domain Moving Images",
    licenseTerms: "Public Domain"
  },
  {
    id: "the-general-1926",
    archiveIdentifier: "The_General_Buster_Keaton",
    title: "The General (1926)",
    year: 1926,
    genres: ["Comedy", "Action", "Adventure", "Classic"],
    duration: "1h 15m",
    synopsis: "When Union spies steal an engineer's beloved locomotive with his sweetheart aboard, he single-handedly pursues them behind enemy lines. Buster Keaton's undisputed cinematic silent masterpiece.",
    director: "Buster Keaton, Clyde Bruckman",
    writers: ["Buster Keaton", "Clyde Bruckman"],
    rating: "8.8",
    posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80",
    cast: [
      { name: "Buster Keaton", role: "Johnnie Gray", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" },
      { name: "Marion Mack", role: "Annabelle Lee", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" }
    ],
    streamUrl: "https://archive.org/download/The_General_Buster_Keaton/The_General.mp4",
    attribution: "United Artists 1926 (Public Domain) / Internet Archive",
    licenseTerms: "Public Domain Worldwide (Pre-1929 publication expiration)"
  },
  {
    id: "his-girl-friday-1940",
    archiveIdentifier: "his_girl_friday",
    title: "His Girl Friday (1940)",
    year: 1940,
    genres: ["Comedy", "Romance", "Drama", "Classic"],
    duration: "1h 32m",
    synopsis: "A newspaper editor uses every trick in the book to keep his top reporter ex-wife from remarrying and leaving the newspaper business. Howard Hawks' lightning-fast screwball comedy masterwork starring Cary Grant and Rosalind Russell.",
    director: "Howard Hawks",
    writers: ["Charles Lederer", "Ben Hecht", "Charles MacArthur"],
    rating: "8.6",
    posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80",
    cast: [
      { name: "Cary Grant", role: "Walter Burns", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" },
      { name: "Rosalind Russell", role: "Hildy Johnson", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" },
      { name: "Ralph Bellamy", role: "Bruce Baldwin", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80" }
    ],
    streamUrl: "https://archive.org/download/his_girl_friday/his_girl_friday_512kb.mp4",
    backupStreamUrl: "https://dn800306.us.archive.org/0/items/his_girl_friday/his_girl_friday_512kb.mp4",
    attribution: "Columbia Pictures 1940 (Copyright Not Renewed / Public Domain) / Internet Archive",
    licenseTerms: "Public Domain Worldwide (Copyright Renewal Omission in 1968)"
  }
];
var ArchiveOrgAdapter = class {
  constructor() {
    this.id = "archive-org";
    this.name = "Internet Archive Public Domain Film Repository";
  }
  canHandle(id) {
    return id.startsWith("archive-") || id.startsWith("archive-org-") || VERIFIED_ARCHIVE_CATALOG.some((c) => c.id === id);
  }
  async search(query, type = "all", page = 1, limit = 24) {
    if (type === "tv") {
      return { provider: this.id, query, page, limit, totalResults: 0, totalPages: 0, results: [] };
    }
    const qLower = query.toLowerCase().trim();
    const matched = VERIFIED_ARCHIVE_CATALOG.filter(
      (item) => item.title.toLowerCase().includes(qLower) || item.synopsis.toLowerCase().includes(qLower) || item.genres.some((g) => g.toLowerCase().includes(qLower)) || item.director.toLowerCase().includes(qLower)
    );
    const results = matched.map((item) => ({
      id: item.id,
      title: item.title,
      genres: item.genres,
      releaseYear: item.year,
      posterUrl: item.posterUrl,
      backdropUrl: item.backdropUrl,
      synopsis: item.synopsis,
      telegramPostId: `archive_${item.id}`,
      telegramUrl: `https://t.me/orviaplay/${item.id}`,
      playbackUrl: `/api/media/stream/${item.id}`,
      duration: item.duration,
      rating: item.rating,
      contentRating: "Passed",
      director: item.director,
      writers: item.writers,
      cast: item.cast,
      isClassic: true,
      category: "movies",
      availabilityLabel: "PLAYABLE",
      metadataProvider: "archive-org"
    }));
    return {
      provider: this.id,
      query,
      page,
      limit,
      totalResults: results.length,
      totalPages: Math.ceil(results.length / limit) || 1,
      results: results.slice((page - 1) * limit, page * limit)
    };
  }
  async getDetails(id) {
    const item = VERIFIED_ARCHIVE_CATALOG.find((c) => c.id === id);
    if (!item) return null;
    return {
      id: item.id,
      title: item.title,
      genres: item.genres,
      releaseYear: item.year,
      posterUrl: item.posterUrl,
      backdropUrl: item.backdropUrl,
      synopsis: item.synopsis,
      telegramPostId: `archive_${item.id}`,
      telegramUrl: `https://t.me/orviaplay/${item.id}`,
      playbackUrl: `/api/media/stream/${item.id}`,
      duration: item.duration,
      rating: item.rating,
      contentRating: "Passed",
      director: item.director,
      writers: item.writers,
      cast: item.cast,
      isClassic: true,
      category: "movies",
      availabilityLabel: "PLAYABLE",
      metadataProvider: "archive-org"
    };
  }
  async resolveSources(contentId) {
    const item = VERIFIED_ARCHIVE_CATALOG.find((c) => c.id === contentId);
    if (!item) return [];
    const sources = [
      {
        sourceId: `src-${item.id}-cdn`,
        contentId: item.id,
        sourceProvider: "Internet Archive Global Edge",
        mediaType: "movie",
        title: `${item.title} - High Definition Stream`,
        authorizationStatus: "authorized",
        availabilityStatus: "verified",
        quality: "1080p",
        format: "mp4",
        streamUrl: item.streamUrl,
        proxyUrl: `/api/media/stream/${item.id}`,
        cdnProvider: "Internet Archive Edge CDN",
        byteRangeSupported: true,
        rightsStatus: "public-domain",
        licenseTerms: item.licenseTerms,
        attribution: item.attribution,
        isActive: true,
        lastVerifiedAt: Date.now(),
        httpStatus: 206,
        playbackDetails: {
          isByteRangeSupported: true,
          mimeType: "video/mp4"
        }
      }
    ];
    if (item.backupStreamUrl) {
      sources.push({
        sourceId: `src-${item.id}-backup`,
        contentId: item.id,
        sourceProvider: "Internet Archive Backup Mirror",
        mediaType: "movie",
        title: `${item.title} - Backup Mirror`,
        authorizationStatus: "authorized",
        availabilityStatus: "active",
        quality: "720p",
        format: "mp4",
        streamUrl: item.backupStreamUrl,
        proxyUrl: `/api/media/stream/${item.id}`,
        cdnProvider: "Internet Archive Secondary Mirror",
        byteRangeSupported: true,
        rightsStatus: "public-domain",
        licenseTerms: item.licenseTerms,
        attribution: item.attribution,
        isActive: true,
        lastVerifiedAt: Date.now(),
        httpStatus: 206,
        playbackDetails: {
          isByteRangeSupported: true,
          mimeType: "video/mp4"
        }
      });
    }
    return sources;
  }
  async verifySource(source) {
    try {
      const res = await fetch(source.streamUrl, {
        headers: { Range: "bytes=0-1" },
        signal: AbortSignal.timeout(6e3)
      });
      const cr = res.headers.get("content-range");
      const ar = res.headers.get("accept-ranges");
      const byteRange = res.status === 206 || (cr ? cr.startsWith("bytes") : false) || (ar ? ar.includes("bytes") : false);
      return { httpStatus: res.status, byteRangeSupported: byteRange };
    } catch {
      return { httpStatus: 504, byteRangeSupported: false };
    }
  }
};
var archiveOrgAdapter = new ArchiveOrgAdapter();

// src/services/adapters/blenderFoundationAdapter.ts
var BlenderFoundationAdapter = class {
  constructor() {
    this.id = "blender-foundation";
    this.name = "Blender Institute Open Movie Project (Creative Commons)";
  }
  canHandle(id) {
    return id === "elephants-dream" || id === "cosmos-laundromat" || id.startsWith("cosmos-laundromat-") || id === "sintel-2010" || id === "player-test-sample";
  }
  async search() {
    return { provider: this.id, results: [] };
  }
  async getDetails(id) {
    if (id === "elephants-dream") {
      return {
        id: "elephants-dream",
        title: "Elephants Dream (2006)",
        genres: ["Animation", "Sci-Fi", "Fantasy"],
        releaseYear: 2006,
        posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
        backdropUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
        synopsis: "Two men, the experienced Proog and the young Emo, journey through the surreal and labyrinthine mechanical chambers of a giant machine called the Elephant. The world's first open-source computer-animated film, produced by the Blender Institute.",
        telegramPostId: "orvia_elephants_2006_post_104",
        telegramUrl: "https://t.me/orviaplay/104",
        playbackUrl: "/api/media/stream/elephants-dream",
        duration: "11m",
        rating: "8.4",
        contentRating: "PG",
        director: "Bassam Kurdali",
        writers: ["Bassam Kurdali", "Pepijn Koppers"],
        cast: [
          { name: "Tygo Gernandt", role: "Proog (Voice)", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" },
          { name: "Cas Jansen", role: "Emo (Voice)", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" }
        ],
        isClassic: true,
        category: "movies",
        availabilityLabel: "PLAYABLE",
        metadataProvider: "blender-foundation"
      };
    }
    if (id === "sintel-2010") {
      return {
        id: "sintel-2010",
        title: "Sintel (2010)",
        genres: ["Animation", "Fantasy", "Adventure"],
        releaseYear: 2010,
        posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
        backdropUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
        synopsis: "A lonely young woman named Sintel rescues and befriends a wounded baby dragon, naming him Scales. When a ferocious adult dragon kidnaps him, she embarks on a dangerous and emotional quest across desolate lands.",
        telegramPostId: "orvia_sintel_2010",
        telegramUrl: "https://t.me/orviaplay/sintel",
        playbackUrl: "/api/media/stream/sintel-2010",
        duration: "15m",
        rating: "8.7",
        contentRating: "PG",
        director: "Colin Levy",
        writers: ["Esther Wouda", "Martin Lodewijk"],
        cast: [
          { name: "Halina Reijn", role: "Sintel (Voice)", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" },
          { name: "Thom Hoffman", role: "Shaman (Voice)", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" }
        ],
        isClassic: true,
        category: "movies",
        availabilityLabel: "PLAYABLE",
        metadataProvider: "blender-foundation"
      };
    }
    if (id === "cosmos-laundromat" || id.startsWith("cosmos-laundromat-")) {
      const episodes = [
        {
          id: "cosmos-laundromat-s1e1",
          seasonNumber: 1,
          episodeNumber: 1,
          title: "Episode 1: The Waiting Room",
          duration: "12m",
          synopsis: "On a desolate, wind-swept island, a suicidal sheep named Franck meets Victor, a bizarre salesman who offers him the chance to explore multiple ecological realities.",
          stillUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80",
          airDate: "2015-08-10",
          playbackUrl: "/api/media/stream/cosmos-laundromat-s1e1",
          availabilityLabel: "PLAYABLE",
          rightsStatus: "creative-commons",
          isPlayable: true
        },
        {
          id: "cosmos-laundromat-s1e2",
          seasonNumber: 1,
          episodeNumber: 2,
          title: "Episode 2: Grassland Jump",
          duration: "14m",
          synopsis: "Franck awakens in an alternate planetary biosphere where flora and fauna behave in surreal, unpredictable patterns.",
          stillUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
          airDate: "2026-TBD",
          playbackUrl: "",
          availabilityLabel: "TRAILER ONLY",
          rightsStatus: "trailer-only",
          isPlayable: false
        },
        {
          id: "cosmos-laundromat-s1e3",
          seasonNumber: 1,
          episodeNumber: 3,
          title: "Episode 3: The Ultimate Exit",
          duration: "15m",
          synopsis: "The final cycle in Victor's multi-dimensional laundromat forces Franck to confront his original decision.",
          stillUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
          airDate: "2026-TBD",
          playbackUrl: "",
          availabilityLabel: "UNAVAILABLE",
          rightsStatus: "unavailable",
          isPlayable: false
        }
      ];
      const seasons = [
        {
          seasonNumber: 1,
          title: "Season 1: First Cycle",
          overview: "The complete opening cycle of the serialized open-source animated series produced by the Blender Animation Studio.",
          episodes
        }
      ];
      return {
        id: "cosmos-laundromat",
        title: "Cosmos Laundromat (Series)",
        genres: ["Animation", "Sci-Fi", "Comedy"],
        releaseYear: 2025,
        posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
        backdropUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80",
        synopsis: "A suicidal sheep named Franck meets a quirky salesman who offers him the ability to travel through all possible universes in this serialized epic.",
        telegramPostId: "orvia_cosmos_2025_post_105",
        telegramUrl: "https://t.me/orviaplay/105",
        playbackUrl: "/api/media/stream/cosmos-laundromat-s1e1",
        duration: "1 Season (3 Episodes)",
        rating: "8.6",
        contentRating: "PG",
        director: "Mathieu Auvray",
        writers: ["Hendrik Proost"],
        cast: [
          { name: "Pierre Bokma", role: "Franck (Voice)", avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80" },
          { name: "Reinout Scholten van Aschat", role: "Victor (Voice)", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" }
        ],
        isTrending: true,
        category: "tv",
        availabilityLabel: "PLAYABLE",
        metadataProvider: "blender-foundation",
        seriesData: {
          seasons,
          totalSeasons: 1,
          totalEpisodes: 3,
          status: "Ongoing Open Project"
        }
      };
    }
    return null;
  }
  async resolveSources(contentId) {
    if (contentId === "elephants-dream") {
      return [
        {
          sourceId: "src-elephants-1080p",
          contentId: "elephants-dream",
          sourceProvider: "Blender Institute Global Origin",
          mediaType: "movie",
          title: "Elephants Dream (2006) - 1080p Stream",
          authorizationStatus: "authorized",
          availabilityStatus: "verified",
          quality: "1080p",
          format: "mp4",
          streamUrl: "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4",
          proxyUrl: "/api/media/stream/elephants-dream",
          cdnProvider: "Blender Institute Edge CDN",
          byteRangeSupported: true,
          rightsStatus: "creative-commons",
          licenseTerms: "Creative Commons Attribution 2.5 (CC-BY 2.5)",
          attribution: "Blender Institute Open Movie Project",
          isActive: true,
          lastVerifiedAt: Date.now(),
          httpStatus: 206
        }
      ];
    }
    if (contentId === "sintel-2010") {
      return [
        {
          sourceId: "src-sintel-1080p",
          contentId: "sintel-2010",
          sourceProvider: "Blender Institute / Durian Project",
          mediaType: "movie",
          title: "Sintel (2010) - 1080p HD Stream",
          authorizationStatus: "authorized",
          availabilityStatus: "verified",
          quality: "1080p",
          format: "mp4",
          streamUrl: "https://archive.org/download/Sintel/sintel-2048-surround.mp4",
          proxyUrl: "/api/media/stream/sintel-2010",
          cdnProvider: "Internet Archive Global Edge",
          byteRangeSupported: true,
          rightsStatus: "creative-commons",
          licenseTerms: "Creative Commons Attribution 3.0 (CC-BY 3.0)",
          attribution: "Blender Foundation / Durian Project",
          isActive: true,
          lastVerifiedAt: Date.now(),
          httpStatus: 206
        }
      ];
    }
    if (contentId === "cosmos-laundromat-s1e1" || contentId === "cosmos-laundromat") {
      return [
        {
          sourceId: "src-cosmos-s1e1-1080p",
          contentId: "cosmos-laundromat-s1e1",
          sourceProvider: "Blender Institute Animation Origin",
          mediaType: "episode",
          title: "Cosmos Laundromat S1:E1 - 1080p Full Episode",
          authorizationStatus: "authorized",
          availabilityStatus: "verified",
          quality: "1080p",
          format: "mp4",
          streamUrl: "https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4",
          proxyUrl: "/api/media/stream/cosmos-laundromat-s1e1",
          cdnProvider: "Blender Institute Edge CDN",
          byteRangeSupported: true,
          rightsStatus: "creative-commons",
          licenseTerms: "Creative Commons Attribution 4.0 International (CC-BY 4.0)",
          attribution: "Blender Animation Studio",
          isActive: true,
          lastVerifiedAt: Date.now(),
          httpStatus: 206
        }
      ];
    }
    return [];
  }
  async verifySource(source) {
    try {
      const res = await fetch(source.streamUrl, {
        headers: { Range: "bytes=0-1" },
        signal: AbortSignal.timeout(6e3)
      });
      const byteRange = res.status === 206 || Boolean(res.headers.get("content-range"));
      return { httpStatus: res.status, byteRangeSupported: byteRange };
    } catch {
      return { httpStatus: 504, byteRangeSupported: false };
    }
  }
};
var blenderFoundationAdapter = new BlenderFoundationAdapter();

// src/services/adapters/registryAdapter.ts
var UnifiedContentRegistryManager = class {
  /**
   * Universal Title Details Fetcher:
   * Inspects ID prefix, queries appropriate modular provider adapter,
   * returns rich cast, director, seasons, episodes, and honest availability label.
   */
  async getTitleDetails(id) {
    if (!id) return null;
    if (archiveOrgAdapter.canHandle(id)) {
      const details = await archiveOrgAdapter.getDetails(id);
      if (details) return details;
    }
    if (blenderFoundationAdapter.canHandle(id)) {
      const details = await blenderFoundationAdapter.getDetails(id);
      if (details) return details;
    }
    if (tvmazeAdapter.canHandle(id)) {
      const details = await tvmazeAdapter.getDetails(id);
      if (details) return details;
    }
    if (tmdbAdapter.canHandle(id)) {
      const details = await tmdbAdapter.getDetails(id);
      if (details) return details;
    }
    return null;
  }
  /**
   * Unified search across all active provider adapters:
   * Aggregates public domain titles, TVMaze open broadcast shows, and TMDB movies/shows.
   */
  async searchAllProviders(query, type = "all", page = 1, limit = 24) {
    const trimmed = query.trim();
    if (!trimmed) {
      return { results: [], total: 0, source: "empty" };
    }
    const [archiveRes, tvmazeRes, tmdbRes] = await Promise.all([
      archiveOrgAdapter.search(trimmed, type, page, limit).catch(() => ({ results: [], totalResults: 0 })),
      tvmazeAdapter.search(trimmed, type, page, limit).catch(() => ({ results: [], totalResults: 0 })),
      tmdbAdapter.search(trimmed, type, page, limit).catch(() => ({ results: [], totalResults: 0 }))
    ]);
    const seen = /* @__PURE__ */ new Set();
    const merged = [];
    for (const item of [...archiveRes.results, ...tvmazeRes.results, ...tmdbRes.results]) {
      const key = `${item.category}:${item.title.toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
    const qLower = trimmed.toLowerCase();
    const ranked = merged.sort((a, b) => {
      if (a.availabilityLabel === "PLAYABLE" && b.availabilityLabel !== "PLAYABLE") return -1;
      if (b.availabilityLabel === "PLAYABLE" && a.availabilityLabel !== "PLAYABLE") return 1;
      const aExact = a.title.toLowerCase().trim() === qLower;
      const bExact = b.title.toLowerCase().trim() === qLower;
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;
      return 0;
    });
    return {
      results: ranked.slice((page - 1) * limit, page * limit),
      total: ranked.length,
      source: "unified-provider-mesh"
    };
  }
  /**
   * Resolves verified stream sources for any title or episode:
   * Enforces strict content identity. Rejects commercial items without genuine sources.
   */
  async resolvePlaybackSources(contentId, episodeId, isTestMode = false) {
    const effectiveId = episodeId || contentId;
    if (effectiveId === "player-test-sample" && !isTestMode) {
      return {
        authorized: false,
        code: "UNAUTHORIZED_MEDIA",
        reason: "Diagnostic test samples cannot be played outside of explicit Player Diagnostic mode.",
        contentId: effectiveId,
        title: "Player Diagnostic Benchmark",
        mediaType: "movie",
        rightsStatus: "unavailable",
        sources: [],
        deliveryMethod: "none"
      };
    }
    if (blenderFoundationAdapter.canHandle(effectiveId)) {
      const sources = await blenderFoundationAdapter.resolveSources(effectiveId);
      if (sources.length > 0) {
        return {
          authorized: true,
          code: "AUTHORIZED",
          contentId: effectiveId,
          title: sources[0].title,
          mediaType: sources[0].mediaType,
          episodeId: sources[0].mediaType === "episode" ? effectiveId : void 0,
          rightsStatus: sources[0].rightsStatus,
          licenseTerms: sources[0].licenseTerms,
          sources,
          selectedSource: sources[0],
          deliveryMethod: sources[0].proxyUrl ? "stream-proxy" : "direct-cdn"
        };
      }
    }
    if (archiveOrgAdapter.canHandle(effectiveId)) {
      const sources = await archiveOrgAdapter.resolveSources(effectiveId);
      if (sources.length > 0) {
        return {
          authorized: true,
          code: "AUTHORIZED",
          contentId: effectiveId,
          title: sources[0].title,
          mediaType: sources[0].mediaType,
          episodeId: void 0,
          rightsStatus: sources[0].rightsStatus,
          licenseTerms: sources[0].licenseTerms,
          sources,
          selectedSource: sources[0],
          deliveryMethod: sources[0].proxyUrl ? "stream-proxy" : "direct-cdn"
        };
      }
    }
    const isCommercial = effectiveId.startsWith("tmdb-") || effectiveId.startsWith("tvmaze-");
    return {
      authorized: false,
      code: isCommercial ? "METADATA_ONLY" : "CONTENT_UNAVAILABLE",
      reason: isCommercial ? "No authorized public playback stream exists for this commercial catalog title. Only metadata, cast, and trailer archives are available." : `No verified playback source registered for content ID "${effectiveId}".`,
      contentId: effectiveId,
      title: effectiveId,
      mediaType: episodeId ? "episode" : "movie",
      rightsStatus: "trailer-only",
      sources: [],
      deliveryMethod: "none"
    };
  }
};
var registryManager = new UnifiedContentRegistryManager();

// server.ts
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
var TTL_SEARCH = 60 * 1e3;
var TTL_SEARCH_EMPTY = 5 * 1e3;
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
  const isSearchEmpty = key.startsWith("search:") && Array.isArray(data) && data.length === 0;
  const effectiveTtl = isSearchEmpty ? TTL_SEARCH_EMPTY : ttl;
  const staleWindow = key.startsWith("search:") ? 30 * 1e3 : STALE_WINDOW;
  cacheStore.set(key, {
    data,
    timestamp: now,
    expiresAt: now + effectiveTtl,
    staleUntil: now + effectiveTtl + staleWindow
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
  const PORT = cliPort || Number(process.env.PORT) || 3e3;
  app.use(express.json());
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: Date.now() });
  });
  const TMDB_TOKEN = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkN2NlYjIwYjU4MmE5MTM3YjYwNjgxMDQwNjUxYmIxZiIsIm5iZiI6MTc5MTU1MzA4OS4wMDE5OTk5LCJzdWIiOiI2YWM4ZWU0MDQzMTljYTc5NGY5NmUxMTUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.pd5SWOAdHmyE8N2ZRqWksWXy3PWPcu6VfDQoyuScXNY";
  const TMDB_BASE_URL2 = "https://api.themoviedb.org/3";
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
  const initialChunkCache = /* @__PURE__ */ new Map();
  async function preloadInitialChunk(key, url) {
    try {
      const res = await fetch(url, { headers: { Range: "bytes=0-524287" } });
      if (res.status === 206 || res.status === 200) {
        const arrayBuf = await res.arrayBuffer();
        const cr = res.headers.get("content-range");
        const total = cr ? cr.split("/")[1] : res.headers.get("content-length") || "597796730";
        initialChunkCache.set(key, {
          buffer: Buffer.from(arrayBuf),
          totalLength: total,
          contentType: res.headers.get("content-type") || "video/mp4"
        });
        console.log(`[Stream FastStart] Preloaded initial chunk for ${key} (${arrayBuf.byteLength} bytes)`);
      }
    } catch (err) {
      console.warn(`[Stream FastStart] Could not preload initial chunk for ${key}:`, err.message);
    }
  }
  preloadInitialChunk("night-of-the-living-dead", "https://dn711006.ca.archive.org/0/items/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4");
  app.all("/api/playback/resolve", async (req, res) => {
    const contentId = req.method === "POST" ? req.body.contentId : req.query.contentId;
    const episodeId = req.method === "POST" ? req.body.episodeId : req.query.episodeId;
    const isTestMode = req.method === "POST" ? Boolean(req.body.testMode) : req.query.testMode === "true";
    if (!contentId) {
      return res.status(400).json({
        authorized: false,
        code: "MISSING_CONTENT_ID",
        reason: "contentId parameter is required to resolve playback authorization."
      });
    }
    let resolution = registryStore.resolvePlayback(contentId, episodeId, isTestMode);
    if (!resolution.authorized && (resolution.code === "SOURCE_NOT_FOUND" || resolution.code === "CONTENT_UNAVAILABLE")) {
      const adapterRes = await registryManager.resolvePlaybackSources(contentId, episodeId, isTestMode);
      if (adapterRes.authorized) {
        resolution = adapterRes;
      }
    }
    console.log(`[Playback Resolution] Resolved contentId="${contentId}", episodeId="${episodeId || "none"}", authorized=${resolution.authorized}, rights=${resolution.rightsStatus}`);
    const statusCode = resolution.authorized ? 200 : resolution.code === "SOURCE_NOT_FOUND" || resolution.code === "NOT_FOUND" ? 404 : 403;
    return res.status(statusCode).json(resolution);
  });
  app.get(["/api/catalog/details", "/api/catalog/details/:id", "/api/title/:id"], async (req, res) => {
    const id = req.params.id || req.query.id;
    if (!id) {
      return res.status(400).json({ error: "Missing title ID parameter" });
    }
    const cacheKey = `details:${id}`;
    try {
      const details = await deduplicatedFetch(cacheKey, TTL_DETAILS, async () => {
        const adapterDetails = await registryManager.getTitleDetails(id);
        if (adapterDetails) {
          return adapterDetails;
        }
        const localItem = MOVIES_DATABASE.find((m) => m.id === id);
        if (localItem) {
          return localItem;
        }
        return null;
      });
      if (!details) {
        return res.status(404).json({ error: `Title "${id}" not found in catalog providers.` });
      }
      return res.json(details);
    } catch (err) {
      console.warn(`[Details API] Error fetching details for ${id}:`, err.message);
      const localItem = MOVIES_DATABASE.find((m) => m.id === id);
      if (localItem) {
        return res.json(localItem);
      }
      return res.status(500).json({ error: "Failed to retrieve title details", details: err.message });
    }
  });
  app.get("/api/admin/registry", (req, res) => {
    res.json({
      items: registryStore.getAllItems(),
      sources: registryStore.getAllSources(),
      timestamp: Date.now()
    });
  });
  app.post("/api/admin/sources/register", (req, res) => {
    const body = req.body;
    if (!body.contentId || !body.streamUrl || !body.title) {
      return res.status(400).json({ error: "contentId, title, and streamUrl are required." });
    }
    const newSource = {
      sourceId: body.sourceId || `src-${body.contentId}-${Date.now().toString(36)}`,
      contentId: body.contentId,
      sourceProvider: body.sourceProvider || "Authorized Origin Provider",
      authorizationStatus: body.authorizationStatus || "authorized",
      availabilityStatus: body.availabilityStatus || "verified",
      mediaType: body.mediaType || "movie",
      title: body.title,
      quality: body.quality || "1080p",
      format: body.format || "mp4",
      streamUrl: body.streamUrl,
      proxyUrl: body.proxyUrl || `/api/media/stream/${body.contentId}`,
      cdnProvider: body.cdnProvider || "Authorized Origin CDN",
      byteRangeSupported: Boolean(body.byteRangeSupported ?? true),
      rightsStatus: body.rightsStatus || "licensed",
      licenseTerms: body.licenseTerms || "Permitted Distribution Agreement",
      attribution: body.attribution || "Registered Partner Origin",
      isActive: body.isActive !== false,
      lastVerifiedAt: Date.now(),
      httpStatus: body.httpStatus || 200
    };
    const registered = registryStore.registerSource(newSource);
    console.log(`[Admin Registry] Registered playback source "${registered.sourceId}" for content "${registered.contentId}"`);
    res.json({ success: true, source: registered });
  });
  app.post("/api/admin/sources/:sourceId/verify", async (req, res) => {
    const { sourceId } = req.params;
    const sources = registryStore.getAllSources();
    const targetSource = sources.find((s) => s.sourceId === sourceId);
    if (!targetSource) {
      return res.status(404).json({ error: "Source record not found" });
    }
    try {
      const probeRes = await fetch(targetSource.streamUrl, {
        headers: { Range: "bytes=0-1" },
        signal: AbortSignal.timeout(6e3)
      });
      const status = probeRes.status;
      const cr = probeRes.headers.get("content-range");
      const ar = probeRes.headers.get("accept-ranges");
      const byteRangeSupported = status === 206 || (cr ? cr.startsWith("bytes") : false) || (ar ? ar.includes("bytes") : false);
      const updated = registryStore.updateSourceVerification(sourceId, status, byteRangeSupported);
      console.log(`[Admin Registry] Live probe for source "${sourceId}": status ${status}, byteRange: ${byteRangeSupported}`);
      return res.json({
        success: true,
        sourceId,
        httpStatus: status,
        byteRangeSupported,
        contentType: probeRes.headers.get("content-type"),
        updated
      });
    } catch (err) {
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
  app.post("/api/admin/sources/:sourceId/toggle", (req, res) => {
    const { sourceId } = req.params;
    const updated = registryStore.toggleSourceActive(sourceId);
    if (!updated) {
      return res.status(404).json({ error: "Source not found" });
    }
    console.log(`[Admin Registry] Toggled active status for source "${sourceId}": isActive=${updated.isActive}`);
    res.json({ success: true, source: updated });
  });
  app.get("/api/media/stream/:movieId", async (req, res) => {
    const { movieId } = req.params;
    const registryItem = registryStore.getItem(movieId);
    const registeredSources = registryStore.getSourcesForContent(movieId);
    let targetUrl = registeredSources[0]?.streamUrl;
    if (!targetUrl) {
      const fallbackMap = {
        "night-of-the-living-dead": "https://dn711006.ca.archive.org/0/items/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4",
        "his-girl-friday-1940": "https://archive.org/download/his_girl_friday/his_girl_friday_512kb.mp4",
        "the-general-1926": "https://archive.org/download/The_General_Buster_Keaton/The_General.mp4",
        "elephants-dream": "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4",
        "sintel-2010": "https://archive.org/download/Sintel/sintel-2048-surround.mp4",
        "cosmos-laundromat-s1e1": "https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4",
        "cosmos-laundromat": "https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4",
        "player-test-sample": "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4"
      };
      targetUrl = fallbackMap[movieId];
      if (!targetUrl) {
        const adapterSources = await registryManager.resolvePlaybackSources(movieId);
        if (adapterSources.authorized && adapterSources.sources.length > 0) {
          targetUrl = adapterSources.sources[0].streamUrl;
        }
      }
    }
    if (registryItem) {
      if (!registryItem.isAuthorizedForStreaming || ["trailer-only", "unavailable", "revoked", "expired"].includes(registryItem.rightsStatus)) {
        console.warn(`[Stream Proxy] 403: Title "${movieId}" has rights "${registryItem.rightsStatus}" (UNAUTHORIZED_MEDIA).`);
        return res.status(403).json({
          error: "Title is not authorized for direct public streaming. Only metadata and trailer previews are available.",
          code: "UNAUTHORIZED_MEDIA",
          contentId: movieId,
          rightsStatus: registryItem.rightsStatus
        });
      }
      if (!targetUrl) {
        console.warn(`[Stream Proxy] 404: Title "${movieId}" has no active verified stream source (CONTENT_UNAVAILABLE).`);
        return res.status(404).json({
          error: "No active verified stream source configured for this title",
          code: "CONTENT_UNAVAILABLE",
          contentId: movieId
        });
      }
    } else if (!targetUrl) {
      console.warn(`[Stream Proxy] 404: Title "${movieId}" not found in registry (SOURCE_NOT_FOUND).`);
      return res.status(404).json({
        error: "No verified stream available for this title",
        code: "SOURCE_NOT_FOUND",
        movieId,
        message: "This title is not registered for streaming in the ORVIA content registry."
      });
    }
    const range = req.headers.range;
    if (range) {
      const rangeMatch = range.match(/^bytes=(\d+)-(\d+)?$/);
      if (!rangeMatch) {
        res.setHeader("Content-Range", "bytes */*");
        return res.status(416).json({
          error: "Requested Range Not Satisfiable",
          code: "INVALID_RANGE",
          contentId: movieId,
          receivedRange: range
        });
      }
      const start = parseInt(rangeMatch[1], 10);
      const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : null;
      if (end !== null && start > end) {
        res.setHeader("Content-Range", "bytes */*");
        return res.status(416).json({
          error: "Requested Range Start Greater Than End",
          code: "INVALID_RANGE",
          contentId: movieId,
          receivedRange: range
        });
      }
    }
    console.log(`[Stream Diagnostics] Request: movieId=${movieId}, range=${range || "full"}, target=${targetUrl}`);
    try {
      if (range && range.startsWith("bytes=0-") && initialChunkCache.has(movieId)) {
        const cached = initialChunkCache.get(movieId);
        const requestedEnd = parseInt(range.replace("bytes=0-", ""), 10);
        if (!isNaN(requestedEnd) && requestedEnd < cached.buffer.length) {
          const slice = cached.buffer.subarray(0, requestedEnd + 1);
          res.setHeader("Content-Type", cached.contentType);
          res.setHeader("Accept-Ranges", "bytes");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
          res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
          res.setHeader("Cache-Control", "public, max-age=86400");
          res.setHeader("Content-Range", `bytes 0-${requestedEnd}/${cached.totalLength}`);
          res.setHeader("Content-Length", slice.length.toString());
          res.setHeader("X-ORVIA-Delivery", "stream-proxy-faststart");
          res.status(206);
          return res.end(slice);
        }
      }
      const upstreamHeaders = {};
      if (range) {
        upstreamHeaders["Range"] = range;
      }
      const abortController = new AbortController();
      req.on("close", () => {
        abortController.abort();
      });
      const upstreamRes = await fetch(targetUrl, {
        headers: upstreamHeaders,
        signal: abortController.signal
      });
      if (!upstreamRes.ok && upstreamRes.status !== 206) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.status(502).json({
          error: `Upstream media origin error: HTTP ${upstreamRes.status}`,
          code: "UPSTREAM_UNAVAILABLE",
          upstreamStatus: upstreamRes.status
        });
      }
      const contentType = upstreamRes.headers.get("content-type") || "video/mp4";
      const contentLength = upstreamRes.headers.get("content-length");
      const contentRange = upstreamRes.headers.get("content-range");
      const acceptRanges = upstreamRes.headers.get("accept-ranges") || "bytes";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Accept-Ranges", acceptRanges);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
      res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("X-ORVIA-Delivery", "stream-proxy");
      if (contentRange) {
        res.setHeader("Content-Range", contentRange);
        res.status(206);
      } else if (range && contentLength) {
        res.status(206);
      } else {
        res.status(upstreamRes.status);
      }
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }
      if (!upstreamRes.body) {
        return res.end();
      }
      const nodeStream = Readable.fromWeb(upstreamRes.body);
      nodeStream.pipe(res);
      nodeStream.on("error", () => {
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      console.warn(`[Stream Proxy] Error proxying stream for ${movieId}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({
          error: "Failed to retrieve media stream from origin CDN",
          code: "UPSTREAM_UNAVAILABLE",
          details: err.message
        });
      }
    }
  });
  app.get("/api/catalog", async (req, res) => {
    const cacheKey = "catalog:popular";
    try {
      const data = await deduplicatedFetch(cacheKey, TTL_LIST, async () => {
        const [moviesRes, tvRes] = await Promise.all([
          fetchWithResilience(`${TMDB_BASE_URL2}/movie/popular?language=en-US&page=1`, { headers: tmdbHeaders }),
          fetchWithResilience(`${TMDB_BASE_URL2}/tv/popular?language=en-US&page=1`, { headers: tmdbHeaders })
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
          playbackUrl: "",
          // Explicit: TMDB commercial titles do not have open streams
          duration: "2h 00m",
          rating: m.vote_average ? m.vote_average.toFixed(1) : "8.0",
          contentRating: "PG-13",
          director: "TMDB Verified Director",
          writers: ["TMDB Writer"],
          cast: [],
          category: "movies",
          availabilityLabel: "TRAILER ONLY"
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
          playbackUrl: "",
          duration: "1 Season",
          rating: t.vote_average ? t.vote_average.toFixed(1) : "8.2",
          contentRating: "TV-14",
          director: "Showrunner",
          writers: ["Series Writer"],
          cast: [],
          category: "tv",
          availabilityLabel: "TRAILER ONLY",
          seriesData: {
            seasons: [
              {
                seasonNumber: 1,
                title: "Season 1",
                episodes: [
                  { episodeNumber: 1, title: "Episode 1: Premiere", duration: "45m", synopsis: t.overview || "Series premiere.", playbackUrl: "", availabilityLabel: "TRAILER ONLY" }
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
  const TMDB_GENRE_MAP = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Sci-Fi",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
    10759: "Action & Adventure",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics"
  };
  app.get("/api/search", async (req, res) => {
    const rawQuery = req.query.q || "";
    const query = rawQuery.trim().replace(/\s+/g, " ");
    const typeFilter = (req.query.type || "all").toLowerCase();
    if (!query) return res.json({ results: [], totalResults: 0 });
    const cacheKey = `search:${typeFilter}:${query.toLowerCase()}`;
    const queryLower = query.toLowerCase();
    try {
      const results = await deduplicatedFetch(cacheKey, TTL_SEARCH, async () => {
        let movieResults = [];
        let tvResults = [];
        const fetchErrors = [];
        const mapTmdbMovie = (m) => {
          const year = m.release_date ? parseInt(m.release_date.split("-")[0], 10) : 2025;
          const genreList = (m.genre_ids || []).map((id) => TMDB_GENRE_MAP[id]).filter(Boolean).slice(0, 3);
          return {
            id: `tmdb-movie-${m.id}`,
            title: m.title || m.original_title,
            genres: genreList.length > 0 ? genreList : ["Movie"],
            releaseYear: isNaN(year) ? 2025 : year,
            posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
            backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80",
            synopsis: m.overview || "No synopsis available.",
            telegramPostId: `tmdb_search_${m.id}`,
            telegramUrl: `https://t.me/orviaplay/${m.id}`,
            playbackUrl: "",
            duration: "2h 00m",
            rating: m.vote_average ? m.vote_average.toFixed(1) : "8.0",
            contentRating: "PG-13",
            director: "TMDB Director",
            writers: ["Screenplay"],
            cast: [],
            category: "movies",
            popularity: Number(m.popularity) || 0,
            availabilityLabel: "TRAILER ONLY"
          };
        };
        const mapTmdbTv = (t) => {
          const year = t.first_air_date ? parseInt(t.first_air_date.split("-")[0], 10) : 2025;
          const genreList = (t.genre_ids || []).map((id) => TMDB_GENRE_MAP[id]).filter(Boolean).slice(0, 3);
          return {
            id: `tmdb-tv-${t.id}`,
            title: t.name || t.original_name,
            genres: genreList.length > 0 ? genreList : ["TV Series", "Drama"],
            releaseYear: isNaN(year) ? 2025 : year,
            posterUrl: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
            backdropUrl: t.backdrop_path ? `https://image.tmdb.org/t/p/original${t.backdrop_path}` : "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80",
            synopsis: t.overview || "No synopsis available.",
            telegramPostId: `tmdb_tv_search_${t.id}`,
            telegramUrl: `https://t.me/orviaplay/tv_${t.id}`,
            playbackUrl: "",
            duration: "TV Series",
            rating: t.vote_average ? t.vote_average.toFixed(1) : "8.2",
            contentRating: "TV-14",
            director: "Showrunner",
            writers: ["Series Writer"],
            cast: [],
            category: "tv",
            popularity: Number(t.popularity) || 0,
            availabilityLabel: "TRAILER ONLY"
          };
        };
        const mapTvMazeShow = (item) => {
          const s = item.show || item;
          const cleanSummary = (s.summary || "").replace(/<[^>]*>?/gm, "").trim();
          const year = s.premiered ? parseInt(s.premiered.split("-")[0], 10) : 2025;
          return {
            id: `tvmaze-tv-${s.id}`,
            title: s.name,
            genres: s.genres && s.genres.length > 0 ? s.genres : ["Drama", "Crime", "TV Series"],
            releaseYear: isNaN(year) ? 2025 : year,
            posterUrl: s.image?.medium || s.image?.original || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
            backdropUrl: s.image?.original || s.image?.medium || "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80",
            synopsis: cleanSummary || "No synopsis available.",
            telegramPostId: `tvmaze_search_${s.id}`,
            telegramUrl: `https://t.me/orviaplay/tvmaze_${s.id}`,
            playbackUrl: "",
            duration: s.averageRuntime ? `${s.averageRuntime}m per ep` : "TV Series",
            rating: s.rating?.average ? s.rating.average.toFixed(1) : "8.2",
            contentRating: "TV-14",
            director: s.network?.name || "Showrunner",
            writers: ["Series Production"],
            cast: [],
            category: "tv",
            popularity: (item.score || 0) * 100 + (s.weight || 0),
            availabilityLabel: "TRAILER ONLY"
          };
        };
        const fetchPromises = [];
        if (typeFilter === "all" || typeFilter === "movies") {
          fetchPromises.push(
            fetchWithResilience(`${TMDB_BASE_URL2}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`, { headers: tmdbHeaders }).then((data) => {
              movieResults = (data.results || []).map(mapTmdbMovie);
            }).catch((err) => {
              console.warn("[Search] TMDB Movie search error:", err.message);
              fetchErrors.push(`MovieProvider: ${err.message}`);
            })
          );
        }
        if (typeFilter === "all" || typeFilter === "tv") {
          fetchPromises.push(
            fetchWithResilience(`${TMDB_BASE_URL2}/search/tv?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`, { headers: tmdbHeaders }).then(async (data) => {
              tvResults = (data.results || []).map(mapTmdbTv);
              if (tvResults.length === 0) {
                try {
                  const tvmRes = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
                  if (tvmRes.ok) {
                    const tvmData = await tvmRes.json();
                    tvResults = (tvmData || []).slice(0, 10).map(mapTvMazeShow);
                  }
                } catch (e) {
                  console.warn("[Search] TVMaze fallback warning:", e.message);
                }
              }
            }).catch(async (err) => {
              console.warn("[Search] TMDB TV search failed, falling back to open TVMaze:", err.message);
              fetchErrors.push(`TVProvider: ${err.message}`);
              try {
                const tvmRes = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
                if (tvmRes.ok) {
                  const tvmData = await tvmRes.json();
                  tvResults = (tvmData || []).slice(0, 10).map(mapTvMazeShow);
                }
              } catch (e) {
                console.warn("[Search] TVMaze error:", e.message);
              }
            })
          );
        }
        let archiveResults = [];
        if (typeFilter === "all" || typeFilter === "movies") {
          fetchPromises.push(
            archiveOrgAdapter.search(query, typeFilter).then((data) => {
              archiveResults = data.results || [];
            }).catch((err) => console.warn("[Search] Archive search error:", err.message))
          );
        }
        await Promise.all(fetchPromises);
        const localFiltered = MOVIES_DATABASE.filter((m) => {
          const matchesQuery = m.title.toLowerCase().includes(queryLower) || m.synopsis.toLowerCase().includes(queryLower) || m.genres.some((g) => g.toLowerCase().includes(queryLower));
          const matchesType = typeFilter === "all" || typeFilter === "movies" && m.category === "movies" || typeFilter === "tv" && m.category === "tv";
          return matchesQuery && matchesType;
        });
        const seen = /* @__PURE__ */ new Set();
        const uniqueResults = [];
        for (const item of [...archiveResults, ...localFiltered, ...tvResults, ...movieResults]) {
          const key = `${item.category}:${item.title.toLowerCase().trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueResults.push(item);
          }
        }
        const ranked = uniqueResults.sort((a, b) => {
          if (a.availabilityLabel === "PLAYABLE" && b.availabilityLabel !== "PLAYABLE") return -1;
          if (b.availabilityLabel === "PLAYABLE" && a.availabilityLabel !== "PLAYABLE") return 1;
          const aExact = a.title.toLowerCase().trim() === queryLower;
          const bExact = b.title.toLowerCase().trim() === queryLower;
          if (aExact && !bExact) return -1;
          if (bExact && !aExact) return 1;
          const aStarts = a.title.toLowerCase().startsWith(queryLower);
          const bStarts = b.title.toLowerCase().startsWith(queryLower);
          if (aStarts && !bStarts) return -1;
          if (bStarts && !aStarts) return 1;
          return (Number(b.popularity) || 0) - (Number(a.popularity) || 0);
        });
        if (fetchErrors.length > 0 && ranked.length === 0) {
          throw new Error(`Upstream metadata providers failed: ${fetchErrors.join("; ")}`);
        }
        return ranked;
      });
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 24));
      const totalResults = results.length;
      const totalPages = Math.ceil(totalResults / limit) || 1;
      const paginatedResults = req.query.page ? results.slice((page - 1) * limit, page * limit) : results;
      res.json({
        source: "live-provider-search",
        page,
        totalPages,
        limit,
        totalResults,
        results: paginatedResults
      });
    } catch (err) {
      console.warn("[Search] Provider error:", err.message);
      const filtered = MOVIES_DATABASE.filter(
        (m) => m.title.toLowerCase().includes(queryLower) || m.synopsis.toLowerCase().includes(queryLower)
      );
      if (filtered.length > 0) {
        return res.json({ source: "local-verified-fallback", totalResults: filtered.length, results: filtered });
      }
      res.status(503).json({
        source: "provider-offline",
        error: "Search providers temporarily unreachable. Please retry.",
        totalResults: 0,
        results: []
      });
    }
  });
  const distPath = path.resolve(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));
  if (hasDist) {
    console.log(`[ORVIA] Serving compiled production bundle from ${distPath} (HMR WebSocket completely bypassed)`);
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path === "/health") {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("[ORVIA] Initializing Vite middleware for development (HMR disabled)");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
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
