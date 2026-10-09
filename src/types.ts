export interface CastMember {
  name: string;
  role: string;
  avatarUrl: string;
}

export type AvailabilityLabel = 'PLAYABLE' | 'TRAILER ONLY' | 'EXTERNAL VIEWING' | 'UNAVAILABLE';

export type PlaybackType = 'full-feature' | 'trailer-only' | 'external-viewing' | 'metadata-only';

export type AvailabilityStatus = 'active' | 'degraded' | 'unavailable' | 'verified';

export interface Episode {
  episodeNumber: number;
  title: string;
  duration: string;
  synopsis: string;
  playbackUrl: string;
  availabilityLabel: AvailabilityLabel;
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
  movieId: string;
  playbackType: PlaybackType;
  providerName: string;
  sourceAttribution: string;
  rightsTerms: string;
  geographicLimit: string;
  apiLimitStatus: string;
  estimatedHostingCost: string;
  lastVerifiedTimestamp: number;
  availabilityStatus: AvailabilityStatus;
  httpStatusCode: number;
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
