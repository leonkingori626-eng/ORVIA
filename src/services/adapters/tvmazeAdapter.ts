import { Movie, Episode, Season, CastMember } from '../../types';
import { MetadataProviderAdapter, CatalogSearchResult } from './types';

export class TVMazeAdapter implements MetadataProviderAdapter {
  public readonly id = 'tvmaze';
  public readonly name = 'TVMaze Open Broadcast Catalog';

  public canHandle(id: string): boolean {
    return id.startsWith('tvmaze-') || id.startsWith('tvmaze-tv-');
  }

  public async search(
    query: string,
    type: 'all' | 'movies' | 'tv' = 'all',
    page: number = 1,
    limit: number = 24
  ): Promise<CatalogSearchResult> {
    if (type === 'movies') {
      return { provider: this.id, query, page, limit, totalResults: 0, totalPages: 0, results: [] };
    }

    try {
      const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        throw new Error(`TVMaze responded with HTTP ${res.status}`);
      }

      const items: any[] = await res.json();
      const results: Movie[] = items.map((item) => {
        const s = item.show || item;
        const cleanSummary = (s.summary || '').replace(/<[^>]*>?/gm, '').trim();
        const year = s.premiered ? parseInt(s.premiered.split('-')[0], 10) : 2025;

        return {
          id: `tvmaze-tv-${s.id}`,
          title: s.name,
          genres: s.genres && s.genres.length > 0 ? s.genres : ['Drama', 'Series'],
          releaseYear: isNaN(year) ? 2025 : year,
          posterUrl: s.image?.medium || s.image?.original || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
          backdropUrl: s.image?.original || s.image?.medium || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
          synopsis: cleanSummary || 'No synopsis available.',
          telegramPostId: `tvmaze_${s.id}`,
          telegramUrl: `https://t.me/orviaplay/tvmaze_${s.id}`,
          playbackUrl: '',
          duration: s.averageRuntime ? `${s.averageRuntime}m per ep` : 'TV Series',
          rating: s.rating?.average ? s.rating.average.toFixed(1) : '8.2',
          contentRating: 'TV-14',
          director: s.network?.name || 'Network Production',
          writers: ['Series Production Team'],
          cast: [],
          category: 'tv',
          availabilityLabel: 'CATALOG',
          hasFullMovie: false,
          metadataProvider: 'tvmaze',
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
        results: paginated,
      };
    } catch (err: any) {
      console.warn('[TVMazeAdapter] Search error:', err.message);
      return { provider: this.id, query, page, limit, totalResults: 0, totalPages: 0, results: [] };
    }
  }

  public async getDetails(id: string): Promise<Movie | null> {
    const numericId = id.replace(/^(tvmaze-tv-|tvmaze-)/, '');
    try {
      const res = await fetch(`https://api.tvmaze.com/shows/${numericId}?embed[]=episodes&embed[]=cast`, {
        signal: AbortSignal.timeout(7000),
      });

      if (!res.ok) {
        return null;
      }

      const show = await res.json();
      const cleanSummary = (show.summary || '').replace(/<[^>]*>?/gm, '').trim();
      const year = show.premiered ? parseInt(show.premiered.split('-')[0], 10) : 2025;

      // Extract cast members
      const cast: CastMember[] = (show._embedded?.cast || []).slice(0, 16).map((c: any) => ({
        name: c.person?.name || 'Cast Member',
        role: c.character?.name || 'Character',
        avatarUrl: c.person?.image?.medium || c.person?.image?.original || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      }));

      // Extract and group episodes into seasons
      const rawEpisodes: any[] = show._embedded?.episodes || [];
      const seasonMap = new Map<number, Episode[]>();

      rawEpisodes.forEach((ep) => {
        const sNum = ep.season || 1;
        if (!seasonMap.has(sNum)) {
          seasonMap.set(sNum, []);
        }

        const cleanEpSummary = (ep.summary || '').replace(/<[^>]*>?/gm, '').trim();
        const epRecord: Episode = {
          id: `tvmaze-ep-${ep.id}`,
          seasonNumber: sNum,
          episodeNumber: ep.number || 1,
          title: ep.name || `Episode ${ep.number}`,
          duration: ep.runtime ? `${ep.runtime}m` : `${show.averageRuntime || 45}m`,
          synopsis: cleanEpSummary || 'No episode synopsis recorded.',
          stillUrl: ep.image?.medium || ep.image?.original,
          airDate: ep.airdate,
          playbackUrl: '', // Honest: commercial broadcast shows do not have open streams
          availabilityLabel: 'METADATA ONLY',
          rightsStatus: 'trailer-only',
          isPlayable: false,
        };

        seasonMap.get(sNum)!.push(epRecord);
      });

      const seasons: Season[] = Array.from(seasonMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([sNum, episodes]) => ({
          seasonNumber: sNum,
          title: `Season ${sNum}`,
          episodes,
        }));

      return {
        id: `tvmaze-tv-${show.id}`,
        title: show.name,
        genres: show.genres && show.genres.length > 0 ? show.genres : ['Drama', 'Crime', 'TV Series'],
        releaseYear: isNaN(year) ? 2025 : year,
        posterUrl: show.image?.medium || show.image?.original || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
        backdropUrl: show.image?.original || show.image?.medium || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
        synopsis: cleanSummary || 'No synopsis available.',
        telegramPostId: `tvmaze_${show.id}`,
        telegramUrl: `https://t.me/orviaplay/tvmaze_${show.id}`,
        playbackUrl: '',
        duration: `${seasons.length} Season${seasons.length > 1 ? 's' : ''}`,
        rating: show.rating?.average ? show.rating.average.toFixed(1) : '8.2',
        contentRating: 'TV-14',
        director: show.network?.name || 'Executive Producers',
        writers: ['Series Writing Staff'],
        cast,
        category: 'tv',
        availabilityLabel: 'CATALOG',
        hasFullMovie: false,
        hasTrailer: false,
        metadataProvider: 'tvmaze',
        seriesData: {
          seasons,
          totalSeasons: seasons.length,
          totalEpisodes: rawEpisodes.length,
          status: show.status,
          network: show.network?.name,
        },
      };
    } catch (err: any) {
      console.warn('[TVMazeAdapter] getDetails error:', err.message);
      return null;
    }
  }
}

export const tvmazeAdapter = new TVMazeAdapter();
