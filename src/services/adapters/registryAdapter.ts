import { Movie, PlaybackStreamSource, PlaybackResolutionResult } from '../../types';
import { tvmazeAdapter } from './tvmazeAdapter';
import { tmdbAdapter } from './tmdbAdapter';
import { archiveOrgAdapter } from './archiveOrgAdapter';
import { blenderFoundationAdapter } from './blenderFoundationAdapter';

export class UnifiedContentRegistryManager {
  /**
   * Universal Title Details Fetcher:
   * Inspects ID prefix, queries appropriate modular provider adapter,
   * returns rich cast, director, seasons, episodes, and honest availability label.
   */
  public async getTitleDetails(id: string): Promise<Movie | null> {
    if (!id) return null;

    // 1. Internet Archive verified public domain titles
    if (archiveOrgAdapter.canHandle(id)) {
      const details = await archiveOrgAdapter.getDetails(id);
      if (details) return details;
    }

    // 2. Blender Foundation open animated movies and series
    if (blenderFoundationAdapter.canHandle(id)) {
      const details = await blenderFoundationAdapter.getDetails(id);
      if (details) return details;
    }

    // 3. TVMaze open broadcast catalog
    if (tvmazeAdapter.canHandle(id)) {
      const details = await tvmazeAdapter.getDetails(id);
      if (details) return details;
    }

    // 4. TMDB live metadata provider
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
  public async searchAllProviders(
    query: string,
    type: 'all' | 'movies' | 'tv' = 'all',
    page: number = 1,
    limit: number = 24
  ): Promise<{ results: Movie[]; total: number; source: string }> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { results: [], total: 0, source: 'empty' };
    }

    // Parallel query to active metadata adapters
    const [archiveRes, tvmazeRes, tmdbRes] = await Promise.all([
      archiveOrgAdapter.search(trimmed, type, page, limit).catch(() => ({ results: [], totalResults: 0 })),
      tvmazeAdapter.search(trimmed, type, page, limit).catch(() => ({ results: [], totalResults: 0 })),
      tmdbAdapter.search(trimmed, type, page, limit).catch(() => ({ results: [], totalResults: 0 })),
    ]);

    // Deduplicate by normalized title + category
    const seen = new Set<string>();
    const merged: Movie[] = [];

    // Prioritize Playable public domain and CC items first
    for (const item of [...archiveRes.results, ...tvmazeRes.results, ...tmdbRes.results]) {
      const key = `${item.category}:${item.title.toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    // Sort: Playable titles first, then exact matches, then standard
    const qLower = trimmed.toLowerCase();
    const ranked = merged.sort((a, b) => {
      if (a.availabilityLabel === 'PLAYABLE' && b.availabilityLabel !== 'PLAYABLE') return -1;
      if (b.availabilityLabel === 'PLAYABLE' && a.availabilityLabel !== 'PLAYABLE') return 1;

      const aExact = a.title.toLowerCase().trim() === qLower;
      const bExact = b.title.toLowerCase().trim() === qLower;
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;

      return 0;
    });

    return {
      results: ranked.slice((page - 1) * limit, page * limit),
      total: ranked.length,
      source: 'unified-provider-mesh',
    };
  }

  /**
   * Resolves verified stream sources for any title or episode:
   * Enforces strict content identity. Rejects commercial items without genuine sources.
   */
  public async resolvePlaybackSources(
    contentId: string,
    episodeId?: string,
    isTestMode: boolean = false
  ): Promise<PlaybackResolutionResult> {
    const effectiveId = episodeId || contentId;

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

    // Check Blender CC adapter
    if (blenderFoundationAdapter.canHandle(effectiveId)) {
      const sources = await blenderFoundationAdapter.resolveSources(effectiveId);
      if (sources.length > 0) {
        return {
          authorized: true,
          code: 'AUTHORIZED',
          contentId: effectiveId,
          title: sources[0].title,
          mediaType: sources[0].mediaType,
          episodeId: sources[0].mediaType === 'episode' ? effectiveId : undefined,
          rightsStatus: sources[0].rightsStatus,
          licenseTerms: sources[0].licenseTerms,
          sources,
          selectedSource: sources[0],
          deliveryMethod: sources[0].proxyUrl ? 'stream-proxy' : 'direct-cdn',
        };
      }
    }

    // Check Archive.org Public Domain adapter
    if (archiveOrgAdapter.canHandle(effectiveId)) {
      const sources = await archiveOrgAdapter.resolveSources(effectiveId);
      if (sources.length > 0) {
        return {
          authorized: true,
          code: 'AUTHORIZED',
          contentId: effectiveId,
          title: sources[0].title,
          mediaType: sources[0].mediaType,
          episodeId: undefined,
          rightsStatus: sources[0].rightsStatus,
          licenseTerms: sources[0].licenseTerms,
          sources,
          selectedSource: sources[0],
          deliveryMethod: sources[0].proxyUrl ? 'stream-proxy' : 'direct-cdn',
        };
      }
    }

    // Commercial or external catalog title
    const isCommercial = effectiveId.startsWith('tmdb-') || effectiveId.startsWith('tvmaze-');
    return {
      authorized: false,
      code: isCommercial ? 'METADATA_ONLY' : 'CONTENT_UNAVAILABLE',
      reason: isCommercial
        ? 'No authorized public playback stream exists for this commercial catalog title. Only metadata, cast, and trailer archives are available.'
        : `No verified playback source registered for content ID "${effectiveId}".`,
      contentId: effectiveId,
      title: effectiveId,
      mediaType: episodeId ? 'episode' : 'movie',
      rightsStatus: 'trailer-only',
      sources: [],
      deliveryMethod: 'none',
    };
  }
}

export const registryManager = new UnifiedContentRegistryManager();
