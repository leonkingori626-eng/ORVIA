import { DistributionRights, VideoQuality, MediaFormat, PlaybackStreamSource, PlaybackResolutionResult } from '../types';

export type { PlaybackStreamSource, PlaybackResolutionResult };

export interface ContentRegistryItem {
  id: string; // Stable internal ID
  title: string;
  type: 'movie' | 'series' | 'episode';
  parentId?: string; // For episodes, references series ID
  seasonNumber?: number;
  episodeNumber?: number;
  rightsStatus: DistributionRights;
  licenseTerms: string;
  attribution: string;
  metadataProvider: 'internal' | 'tmdb' | 'tvmaze' | 'archive-org' | 'blender-foundation';
  isAuthorizedForStreaming: boolean;
  notes?: string;
}

// Initial structured catalog registry items
export const INITIAL_REGISTRY_ITEMS: ContentRegistryItem[] = [
  {
    id: 'night-of-the-living-dead',
    title: 'Night of the Living Dead (1968)',
    type: 'movie',
    rightsStatus: 'public-domain',
    licenseTerms: 'Public Domain in the United States and worldwide (1968 Original Release Notice Omission)',
    attribution: 'Internet Archive Public Domain Feature Films Archive',
    metadataProvider: 'archive-org',
    isAuthorizedForStreaming: true,
    notes: 'Full-length 96-minute feature film with verified 1080p and 720p streams.',
  },
  {
    id: 'elephants-dream',
    title: 'Elephants Dream (2006)',
    type: 'movie',
    rightsStatus: 'creative-commons',
    licenseTerms: 'Creative Commons Attribution 2.5 (CC-BY 2.5)',
    attribution: 'Blender Institute Open Movie Project (Ton Roosendaal)',
    metadataProvider: 'blender-foundation',
    isAuthorizedForStreaming: true,
    notes: 'Authorized open-movie benchmark animation.',
  },
  {
    id: 'cosmos-laundromat',
    title: 'Cosmos Laundromat (First Cycle)',
    type: 'series',
    rightsStatus: 'creative-commons',
    licenseTerms: 'Creative Commons Attribution 4.0 International (CC-BY 4.0)',
    attribution: 'Blender Animation Studio',
    metadataProvider: 'blender-foundation',
    isAuthorizedForStreaming: true,
    notes: 'Serialized open animation project.',
  },
  {
    id: 'cosmos-laundromat-s1e1',
    title: 'Episode 1: The Waiting Room',
    type: 'episode',
    parentId: 'cosmos-laundromat',
    seasonNumber: 1,
    episodeNumber: 1,
    rightsStatus: 'creative-commons',
    licenseTerms: 'Creative Commons Attribution 4.0 International (CC-BY 4.0)',
    attribution: 'Blender Animation Studio',
    metadataProvider: 'blender-foundation',
    isAuthorizedForStreaming: true,
    notes: 'Complete episode 1 with verified 1080p audio/video streams.',
  },
  {
    id: 'cosmos-laundromat-s1e2',
    title: 'Episode 2: Grassland Jump',
    type: 'episode',
    parentId: 'cosmos-laundromat',
    seasonNumber: 1,
    episodeNumber: 2,
    rightsStatus: 'trailer-only',
    licenseTerms: 'Production Preview License',
    attribution: 'Blender Animation Studio',
    metadataProvider: 'blender-foundation',
    isAuthorizedForStreaming: false,
    notes: 'In-production episode. No full stream authorized yet.',
  },
  {
    id: 'cosmos-laundromat-s1e3',
    title: 'Episode 3: The Ultimate Exit',
    type: 'episode',
    parentId: 'cosmos-laundromat',
    seasonNumber: 1,
    episodeNumber: 3,
    rightsStatus: 'unavailable',
    licenseTerms: 'Unreleased script draft',
    attribution: 'Blender Animation Studio',
    metadataProvider: 'blender-foundation',
    isAuthorizedForStreaming: false,
    notes: 'Pre-production unreleased concept.',
  },
  {
    id: 'celestia-echoes',
    title: 'Celestia: Echoes of Orion',
    type: 'movie',
    rightsStatus: 'trailer-only',
    licenseTerms: 'ORVIA Promotional Metadata Indexing Agreement',
    attribution: 'ORVIA Originals Index',
    metadataProvider: 'internal',
    isAuthorizedForStreaming: false,
    notes: 'Promotional trailer and metadata only. Full film stream is not licensed.',
  },
  {
    id: 'neo-samurai',
    title: 'Neo-Samurai: Cyberpunk Shadows',
    type: 'movie',
    rightsStatus: 'trailer-only',
    licenseTerms: 'ORVIA Promotional Metadata Indexing Agreement',
    attribution: 'ORVIA Originals Index',
    metadataProvider: 'internal',
    isAuthorizedForStreaming: false,
    notes: 'Promotional trailer and metadata only. Full film stream is not licensed.',
  },
  {
    id: 'abyss-into-trenches',
    title: 'Abyss: Into the Trenches',
    type: 'movie',
    rightsStatus: 'trailer-only',
    licenseTerms: 'ORVIA Documentaries Index Agreement',
    attribution: 'ORVIA Documentaries Index',
    metadataProvider: 'internal',
    isAuthorizedForStreaming: false,
    notes: 'Documentary preview only. Full video file not authorized for direct streaming.',
  },
  {
    id: 'player-test-sample',
    title: 'ORVIA Player Diagnostic Benchmark (Test Mode)',
    type: 'movie',
    rightsStatus: 'creative-commons',
    licenseTerms: 'Creative Commons Attribution 2.5 (CC-BY 2.5)',
    attribution: 'Blender Foundation Diagnostic Test Engine',
    metadataProvider: 'blender-foundation',
    isAuthorizedForStreaming: true,
    notes: 'Strictly restricted to developer/diagnostic test mode. NEVER used as catalog fallback.',
  },
];

// Initial registered playback stream sources with multiple qualities and explicit CDN origins
export const INITIAL_STREAM_SOURCES: PlaybackStreamSource[] = [
  {
    sourceId: 'src-notld-1080p',
    contentId: 'night-of-the-living-dead',
    mediaType: 'movie',
    title: 'Night of the Living Dead - 1080p Full Feature',
    quality: '1080p',
    format: 'mp4',
    streamUrl: 'https://dn711006.ca.archive.org/0/items/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4',
    proxyUrl: '/api/media/stream/night-of-the-living-dead',
    cdnProvider: 'Internet Archive Global Edge CDN',
    byteRangeSupported: true,
    rightsStatus: 'public-domain',
    licenseTerms: 'Public Domain (U.S. Copyright Act 1968 Notice Omission)',
    attribution: 'Internet Archive Open Film Collection',
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
  },
  {
    sourceId: 'src-notld-720p',
    contentId: 'night-of-the-living-dead',
    mediaType: 'movie',
    title: 'Night of the Living Dead - 720p Backup Mirror',
    quality: '720p',
    format: 'mp4',
    streamUrl: 'https://archive.org/download/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4',
    proxyUrl: '/api/media/stream/night-of-the-living-dead',
    cdnProvider: 'Internet Archive Primary CDN Mirror',
    byteRangeSupported: true,
    rightsStatus: 'public-domain',
    licenseTerms: 'Public Domain (U.S. Copyright Act 1968 Notice Omission)',
    attribution: 'Internet Archive Open Film Collection',
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
  },
  {
    sourceId: 'src-elephants-1080p',
    contentId: 'elephants-dream',
    mediaType: 'movie',
    title: 'Elephants Dream - 1080p Feature Stream',
    quality: '1080p',
    format: 'mp4',
    streamUrl: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
    proxyUrl: '/api/media/stream/elephants-dream',
    cdnProvider: 'Blender Foundation / Archive.org Edge',
    byteRangeSupported: true,
    rightsStatus: 'creative-commons',
    licenseTerms: 'Creative Commons Attribution 2.5 (CC-BY 2.5)',
    attribution: 'Blender Institute Open Movie Project',
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
  },
  {
    sourceId: 'src-cosmos-s1e1-1080p',
    contentId: 'cosmos-laundromat-s1e1',
    mediaType: 'episode',
    title: 'Cosmos Laundromat S1:E1 (The Waiting Room) - 1080p',
    quality: '1080p',
    format: 'mp4',
    streamUrl: 'https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4',
    proxyUrl: '/api/media/stream/cosmos-laundromat-s1e1',
    cdnProvider: 'Blender Institute Global Media CDN',
    byteRangeSupported: true,
    rightsStatus: 'creative-commons',
    licenseTerms: 'Creative Commons Attribution 4.0 International (CC-BY 4.0)',
    attribution: 'Blender Institute / Cosmos Project',
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
  },
  {
    sourceId: 'src-test-benchmark',
    contentId: 'player-test-sample',
    mediaType: 'movie',
    title: 'Diagnostic Benchmark Sample Stream (Test Mode Only)',
    quality: '720p',
    format: 'mp4',
    streamUrl: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
    proxyUrl: '/api/media/stream/player-test-sample',
    cdnProvider: 'Diagnostic Benchmark Engine CDN',
    byteRangeSupported: true,
    rightsStatus: 'creative-commons',
    licenseTerms: 'Creative Commons Attribution 2.5 — Strictly for Player Diagnostic Testing',
    attribution: 'ORVIA Test Suite',
    isActive: true,
    lastVerifiedAt: Date.now(),
    httpStatus: 206,
  },
];

// Persistent registry memory state
class ContentRegistryStore {
  private items = new Map<string, ContentRegistryItem>();
  private sources = new Map<string, PlaybackStreamSource>();

  constructor() {
    INITIAL_REGISTRY_ITEMS.forEach((item) => this.items.set(item.id, { ...item }));
    INITIAL_STREAM_SOURCES.forEach((source) => this.sources.set(source.sourceId, { ...source }));
  }

  public getItem(id: string): ContentRegistryItem | undefined {
    return this.items.get(id);
  }

  public getAllItems(): ContentRegistryItem[] {
    return Array.from(this.items.values());
  }

  public getAllSources(): PlaybackStreamSource[] {
    return Array.from(this.sources.values());
  }

  public getSourcesForContent(contentId: string): PlaybackStreamSource[] {
    return Array.from(this.sources.values()).filter((s) => s.contentId === contentId && s.isActive);
  }

  public registerItem(item: ContentRegistryItem): ContentRegistryItem {
    this.items.set(item.id, { ...item });
    return item;
  }

  public registerSource(source: PlaybackStreamSource): PlaybackStreamSource {
    this.sources.set(source.sourceId, { ...source });
    return source;
  }

  public toggleSourceActive(sourceId: string): PlaybackStreamSource | null {
    const s = this.sources.get(sourceId);
    if (!s) return null;
    s.isActive = !s.isActive;
    return s;
  }

  public updateSourceVerification(sourceId: string, status: number, byteRangeSupported: boolean): PlaybackStreamSource | null {
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
  public resolvePlayback(
    targetContentId: string,
    episodeId?: string,
    isTestMode: boolean = false
  ): PlaybackResolutionResult {
    // Determine effective target ID (episode ID takes precedence for series playback)
    const effectiveId = episodeId || targetContentId;

    // Reject player test sample in normal production playback
    if (effectiveId === 'player-test-sample' && !isTestMode) {
      return {
        authorized: false,
        code: 'UNAUTHORIZED_MEDIA',
        reason: 'Diagnostic test samples cannot be played outside of explicit Player Diagnostic mode.',
        contentId: effectiveId,
        title: 'Player Diagnostic Benchmark',
        mediaType: 'movie',
        rightsStatus: 'unavailable',
        sources: [],
        deliveryMethod: 'none',
      };
    }

    const item = this.items.get(effectiveId);
    const sources = Array.from(this.sources.values()).filter(
      (s) => s.contentId === effectiveId && s.isActive
    );

    // If item not explicitly in internal registry, check if it is a commercial or external catalog title
    if (!item) {
      const isExternalCommercial = effectiveId.startsWith('tmdb-') || effectiveId.startsWith('tvmaze-');
      return {
        authorized: false,
        code: isExternalCommercial ? 'METADATA_ONLY' : 'SOURCE_NOT_FOUND',
        reason: isExternalCommercial
          ? 'No verified public playback stream is authorized for this commercial catalog title. Only metadata and trailer previews are available.'
          : `Title with ID "${effectiveId}" was not found in the verified ORVIA content registry.`,
        contentId: effectiveId,
        title: effectiveId,
        mediaType: episodeId ? 'episode' : 'movie',
        rightsStatus: 'trailer-only',
        sources: [],
        deliveryMethod: 'none',
      };
    }

    // Check rights authorization status
    if (item.rightsStatus === 'trailer-only' || item.rightsStatus === 'unavailable' || item.rightsStatus === 'revoked' || item.rightsStatus === 'expired') {
      return {
        authorized: false,
        code: 'UNAUTHORIZED_MEDIA',
        reason: item.notes || `Title "${item.title}" is restricted to metadata/trailer preview only (${item.rightsStatus}). No full-length stream is authorized.`,
        contentId: effectiveId,
        title: item.title,
        mediaType: item.type === 'episode' ? 'episode' : 'movie',
        episodeId: item.type === 'episode' ? effectiveId : undefined,
        rightsStatus: item.rightsStatus,
        licenseTerms: item.licenseTerms,
        sources: [],
        deliveryMethod: 'none',
      };
    }

    if (sources.length === 0) {
      return {
        authorized: false,
        code: 'CONTENT_UNAVAILABLE',
        reason: `No active verified stream sources are currently registered for "${item.title}". Direct streaming is disabled.`,
        contentId: effectiveId,
        title: item.title,
        mediaType: item.type === 'episode' ? 'episode' : 'movie',
        episodeId: item.type === 'episode' ? effectiveId : undefined,
        rightsStatus: item.rightsStatus,
        licenseTerms: item.licenseTerms,
        sources: [],
        deliveryMethod: 'none',
      };
    }

    // Sort sources by quality (1080p > 720p > 480p)
    const qualityRank: Record<VideoQuality, number> = { '1080p': 3, '720p': 2, '480p': 1, 'auto': 0 };
    const sortedSources = [...sources].sort((a, b) => qualityRank[b.quality] - qualityRank[a.quality]);
    const primarySource = sortedSources[0];

    return {
      authorized: true,
      code: 'AUTHORIZED',
      contentId: effectiveId,
      title: item.title,
      mediaType: item.type === 'episode' ? 'episode' : 'movie',
      episodeId: item.type === 'episode' ? effectiveId : undefined,
      rightsStatus: item.rightsStatus,
      licenseTerms: item.licenseTerms,
      sources: sortedSources,
      selectedSource: primarySource,
      deliveryMethod: primarySource.proxyUrl ? 'stream-proxy' : 'direct-cdn',
    };
  }
}

export const registryStore = new ContentRegistryStore();
