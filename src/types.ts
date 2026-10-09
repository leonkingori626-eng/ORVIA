export type DistributionRights = 
  | 'public-domain'
  | 'creative-commons'
  | 'licensed'
  | 'trailer-only'
  | 'unavailable'
  | 'revoked'
  | 'expired';

export type MediaFormat = 'mp4' | 'webm' | 'hls' | 'dash';
export type VideoQuality = '1080p' | '720p' | '480p' | 'auto';
export type MetadataProviderId = 'internal' | 'tmdb' | 'tvmaze' | 'archive-org' | 'blender-foundation';

export interface PlaybackStreamSource {
  sourceId: string;
  contentId: string; // internal stable ID of movie or episode
  mediaType: 'movie' | 'episode';
  title: string;
  quality: VideoQuality;
  format: MediaFormat;
  streamUrl: string; // Direct CDN or verified stream URL
  proxyUrl?: string; // Applet internal byte-range streaming proxy
  cdnProvider: string;
  byteRangeSupported: boolean;
  rightsStatus: DistributionRights;
  licenseTerms: string;
  attribution: string;
  isActive: boolean;
  lastVerifiedAt: number;
  httpStatus: number;
}

export interface PlaybackResolutionResult {
  authorized: boolean;
  code?: 
    | 'AUTHORIZED' 
    | 'UNAUTHORIZED_MEDIA' 
    | 'SOURCE_NOT_FOUND' 
    | 'INVALID_RANGE' 
    | 'UPSTREAM_UNAVAILABLE' 
    | 'CONTENT_UNAVAILABLE' 
    | 'SOURCE_REVOKED' 
    | 'METADATA_ONLY' 
    | 'NOT_FOUND' 
    | 'UNAUTHORIZED_OR_UNAVAILABLE';
  reason?: string;
  contentId: string;
  title: string;
  mediaType: 'movie' | 'episode';
  episodeId?: string;
  rightsStatus: DistributionRights;
  licenseTerms?: string;
  sources: PlaybackStreamSource[];
  selectedSource?: PlaybackStreamSource;
  deliveryMethod: 'direct-cdn' | 'stream-proxy' | 'none';
}

export interface CastMember {
  name: string;
  role: string;
  avatarUrl: string;
}

export type AvailabilityLabel = 'PLAYABLE' | 'TRAILER ONLY' | 'EXTERNAL VIEWING' | 'UNAVAILABLE';

export type PlaybackType = 'full-feature' | 'trailer-only' | 'external-viewing' | 'metadata-only';

export type AvailabilityStatus = 'active' | 'degraded' | 'unavailable' | 'verified';

export interface Episode {
  id?: string;
  episodeNumber: number;
  title: string;
  duration: string;
  synopsis: string;
  playbackUrl: string;
  availabilityLabel: AvailabilityLabel;
  rightsStatus?: DistributionRights;
}

export interface Season {
  seasonNumber: number;
  title: string;
  episodes: Episode[];
}

export interface SeriesMetadata {
  seasons: Season[];
}

export interface PlaybackSourceRecord {
  catalogProvider: 'internal' | 'tmdb' | 'tvmaze';
  catalogId: string;
  mediaType: 'movie' | 'series' | 'episode';
  seriesId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  movieId: string; // for compatibility
  sourceProvider: string;
  sourceIdentifier: string;
  providerName: string; // for compatibility
  sourceAttribution: string;
  playbackType: PlaybackType;
  verifiedMediaUrl: string;
  contentType: string;
  playbackFormat: string;
  rightsTerms: string;
  geographicLimit: string;
  apiLimitStatus: string;
  estimatedHostingCost: string;
  lastVerifiedTimestamp: number;
  availabilityStatus: AvailabilityStatus;
  httpStatusCode: number;
}

export interface PlayingMediaItem {
  movie: Movie;
  episode?: Episode;
  seasonNumber?: number;
}

export interface Movie {
  id: string;
  title: string;
  genres: string[];
  releaseYear: number;
  posterUrl: string;
  backdropUrl: string;
  synopsis: string;
  telegramPostId: string;
  telegramUrl: string;
  playbackUrl: string;
  duration: string;
  rating: string;
  contentRating: string;
  director: string;
  writers: string[];
  cast: CastMember[];
  isFeatured?: boolean;
  isTrending?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isClassic?: boolean;
  category: 'movies' | 'tv' | 'documentary';
  availabilityLabel: AvailabilityLabel;
  seriesData?: SeriesMetadata;
  sourceRecord?: PlaybackSourceRecord;
}

export interface ContinueItem {
  movieId: string;
  progressSeconds: number;
  totalDurationSeconds: number;
  lastWatched: number;
}

export interface WatchlistItem {
  movieId: string;
  addedAt: number;
}

export interface DownloadItem {
  movieId: string;
  telegramPostId: string;
  requestedAt: number;
  status: 'ready' | 'redirecting' | 'error' | 'fallback';
}
