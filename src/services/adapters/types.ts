import { Movie, PlaybackStreamSource, Episode, Season } from '../../types';

export interface CatalogSearchResult {
  provider: string;
  query: string;
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
  results: Movie[];
}

export interface MetadataProviderAdapter {
  id: string;
  name: string;
  canHandle(id: string): boolean;
  search(query: string, type: 'all' | 'movies' | 'tv', page?: number, limit?: number): Promise<CatalogSearchResult>;
  getDetails(id: string): Promise<Movie | null>;
  getSeasonsAndEpisodes?(id: string): Promise<Season[]>;
}

export interface PlaybackSourceAdapter {
  id: string;
  name: string;
  canHandle(contentId: string): boolean;
  resolveSources(contentId: string, episodeId?: string): Promise<PlaybackStreamSource[]>;
  verifySource(source: PlaybackStreamSource): Promise<{ httpStatus: number; byteRangeSupported: boolean }>;
}
