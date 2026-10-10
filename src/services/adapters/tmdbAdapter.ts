import { Movie, Episode, Season, CastMember } from '../../types';
import { MetadataProviderAdapter, CatalogSearchResult } from './types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Standard fallback Bearer token from configuration
const FALLBACK_TMDB_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkN2NlYjIwYjU4MmE5MTM3YjYwNjgxMDQwNjUxYmIxZiIsIm5iZiI6MTc5MTU1MzA4OS4wMDE5OTk5LCJzdWIiOiI2YWM4ZWU0MDQzMTljYTc5NGY5NmUxMTUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.pd5SWOAdHmyE8N2ZRqWksWXy3PWPcu6VfDQoyuScXNY';

export class TMDBAdapter implements MetadataProviderAdapter {
  public readonly id = 'tmdb';
  public readonly name = 'The Movie Database (TMDB)';

  private getAuthHeader(): Record<string, string> {
    const token = (typeof process !== 'undefined' && process.env?.TMDB_API_KEY) || FALLBACK_TMDB_TOKEN;
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  public canHandle(id: string): boolean {
    return id.startsWith('tmdb-') || id.startsWith('tmdb-movie-') || id.startsWith('tmdb-tv-');
  }

  public async search(
    query: string,
    type: 'all' | 'movies' | 'tv' = 'all',
    page: number = 1,
    limit: number = 24
  ): Promise<CatalogSearchResult> {
    const headers = this.getAuthHeader();
    const movieResults: Movie[] = [];
    const tvResults: Movie[] = [];

    const promises: Promise<void>[] = [];

    if (type === 'all' || type === 'movies') {
      promises.push(
        fetch(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=${page}`, {
          headers,
          signal: AbortSignal.timeout(6000),
        })
          .then(async (res) => {
            if (!res.ok) return;
            const data = await res.json();
            (data.results || []).forEach((m: any) => {
              const year = m.release_date ? parseInt(m.release_date.split('-')[0], 10) : 2025;
              movieResults.push({
                id: `tmdb-movie-${m.id}`,
                title: m.title || m.original_title,
                genres: ['Movie', 'Cinema'],
                releaseYear: isNaN(year) ? 2025 : year,
                posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}/w500${m.poster_path}` : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
                backdropUrl: m.backdrop_path ? `${TMDB_IMAGE_BASE}/original${m.backdrop_path}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80',
                synopsis: m.overview || 'No synopsis recorded.',
                telegramPostId: `tmdb_${m.id}`,
                telegramUrl: `https://t.me/orviaplay/${m.id}`,
                playbackUrl: '', // Commercial movie: no unauthorized stream
                duration: '2h 00m',
                rating: m.vote_average ? m.vote_average.toFixed(1) : '8.0',
                contentRating: 'PG-13',
                director: 'Studio Production',
                writers: ['Screenplay Staff'],
                cast: [],
                category: 'movies',
                availabilityLabel: 'CATALOG',
                hasFullMovie: false,
                metadataProvider: 'tmdb',
              });
            });
          })
          .catch((err) => console.warn('[TMDBAdapter] Movie search failed:', err.message))
      );
    }

    if (type === 'all' || type === 'tv') {
      promises.push(
        fetch(`${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=${page}`, {
          headers,
          signal: AbortSignal.timeout(6000),
        })
          .then(async (res) => {
            if (!res.ok) return;
            const data = await res.json();
            (data.results || []).forEach((t: any) => {
              const year = t.first_air_date ? parseInt(t.first_air_date.split('-')[0], 10) : 2025;
              tvResults.push({
                id: `tmdb-tv-${t.id}`,
                title: t.name || t.original_name,
                genres: ['TV Series', 'Drama'],
                releaseYear: isNaN(year) ? 2025 : year,
                posterUrl: t.poster_path ? `${TMDB_IMAGE_BASE}/w500${t.poster_path}` : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
                backdropUrl: t.backdrop_path ? `${TMDB_IMAGE_BASE}/original${t.backdrop_path}` : 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
                synopsis: t.overview || 'No synopsis recorded.',
                telegramPostId: `tmdb_tv_${t.id}`,
                telegramUrl: `https://t.me/orviaplay/tv_${t.id}`,
                playbackUrl: '',
                duration: 'TV Series',
                rating: t.vote_average ? t.vote_average.toFixed(1) : '8.2',
                contentRating: 'TV-14',
                director: 'Executive Producers',
                writers: ['Series Writing Staff'],
                cast: [],
                category: 'tv',
                availabilityLabel: 'CATALOG',
                hasFullMovie: false,
                metadataProvider: 'tmdb',
              });
            });
          })
          .catch((err) => console.warn('[TMDBAdapter] TV search failed:', err.message))
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
      results: combined.slice(0, limit),
    };
  }

  public async getDetails(id: string): Promise<Movie | null> {
    const isTv = id.includes('-tv-');
    const numericId = id.replace(/^(tmdb-movie-|tmdb-tv-|tmdb-)/, '');
    const headers = this.getAuthHeader();

    try {
      if (isTv) {
        const res = await fetch(`${TMDB_BASE_URL}/tv/${numericId}?append_to_response=credits,videos`, {
          headers,
          signal: AbortSignal.timeout(7000),
        });
        if (!res.ok) return null;
        const data = await res.json();

        const cast: CastMember[] = (data.credits?.cast || []).slice(0, 16).map((c: any) => ({
          name: c.name || 'Cast Member',
          role: c.character || 'Character',
          avatarUrl: c.profile_path ? `${TMDB_IMAGE_BASE}/w300${c.profile_path}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        }));

        const year = data.first_air_date ? parseInt(data.first_air_date.split('-')[0], 10) : 2025;
        const genres = (data.genres || []).map((g: any) => g.name);

        // Fetch Season 1 episodes for rich episode view
        let season1Episodes: Episode[] = [];
        try {
          const sRes = await fetch(`${TMDB_BASE_URL}/tv/${numericId}/season/1`, {
            headers,
            signal: AbortSignal.timeout(5000),
          });
          if (sRes.ok) {
            const sData = await sRes.json();
            season1Episodes = (sData.episodes || []).map((ep: any) => ({
              id: `tmdb-ep-${data.id}-s1e${ep.episode_number}`,
              seasonNumber: 1,
              episodeNumber: ep.episode_number,
              title: ep.name || `Episode ${ep.episode_number}`,
              duration: ep.runtime ? `${ep.runtime}m` : '45m',
              synopsis: ep.overview || 'No episode synopsis recorded.',
              stillUrl: ep.still_path ? `${TMDB_IMAGE_BASE}/w500${ep.still_path}` : undefined,
              airDate: ep.air_date,
              playbackUrl: '',
              availabilityLabel: 'METADATA ONLY',
              rightsStatus: 'trailer-only',
              isPlayable: false,
            }));
          }
        } catch (e: any) {
          console.warn('[TMDBAdapter] Season 1 fetch error:', e.message);
        }

        const seasons: Season[] = (data.seasons || [])
          .filter((s: any) => s.season_number > 0)
          .map((s: any) => ({
            seasonNumber: s.season_number,
            title: s.name || `Season ${s.season_number}`,
            overview: s.overview,
            posterUrl: s.poster_path ? `${TMDB_IMAGE_BASE}/w300${s.poster_path}` : undefined,
            airDate: s.air_date,
            episodes: s.season_number === 1 ? season1Episodes : [],
          }));

        // YouTube trailer if available
        const trailerVideo = (data.videos?.results || []).find((v: any) => v.site === 'YouTube' && v.type === 'Trailer')
          || (data.videos?.results || []).find((v: any) => v.site === 'YouTube' && (v.type === 'Teaser' || v.type === 'Clip'));
        const trailerKey = trailerVideo?.key;
        const trailerUrl = trailerKey ? `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0` : undefined;

        return {
          id: `tmdb-tv-${data.id}`,
          title: data.name || data.original_name,
          genres: genres.length > 0 ? genres : ['Drama', 'TV Series'],
          releaseYear: isNaN(year) ? 2025 : year,
          posterUrl: data.poster_path ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}` : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
          backdropUrl: data.backdrop_path ? `${TMDB_IMAGE_BASE}/original${data.backdrop_path}` : 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
          synopsis: data.overview || 'No synopsis recorded.',
          telegramPostId: `tmdb_tv_${data.id}`,
          telegramUrl: `https://t.me/orviaplay/tv_${data.id}`,
          playbackUrl: '',
          duration: `${seasons.length} Season${seasons.length > 1 ? 's' : ''}`,
          rating: data.vote_average ? data.vote_average.toFixed(1) : '8.2',
          contentRating: 'TV-14',
          director: data.created_by?.[0]?.name || 'Executive Showrunner',
          writers: (data.created_by || []).map((c: any) => c.name),
          cast,
          category: 'tv',
          availabilityLabel: 'CATALOG',
          hasFullMovie: false,
          hasTrailer: Boolean(trailerUrl),
          trailerUrl,
          trailerYoutubeKey: trailerKey,
          metadataProvider: 'tmdb',
          seriesData: {
            seasons,
            totalSeasons: seasons.length,
            totalEpisodes: data.number_of_episodes,
            status: data.status,
          },
        };
      } else {
        // Movie details
        const res = await fetch(`${TMDB_BASE_URL}/movie/${numericId}?append_to_response=credits,videos`, {
          headers,
          signal: AbortSignal.timeout(7000),
        });
        if (!res.ok) return null;
        const data = await res.json();

        const cast: CastMember[] = (data.credits?.cast || []).slice(0, 16).map((c: any) => ({
          name: c.name || 'Cast Member',
          role: c.character || 'Character',
          avatarUrl: c.profile_path ? `${TMDB_IMAGE_BASE}/w300${c.profile_path}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        }));

        const director = (data.credits?.crew || []).find((c: any) => c.job === 'Director')?.name || 'Director';
        const writers = (data.credits?.crew || [])
          .filter((c: any) => c.department === 'Writing')
          .slice(0, 3)
          .map((c: any) => c.name);

        const year = data.release_date ? parseInt(data.release_date.split('-')[0], 10) : 2025;
        const genres = (data.genres || []).map((g: any) => g.name);
        const runtimeH = Math.floor((data.runtime || 120) / 60);
        const runtimeM = (data.runtime || 120) % 60;

        const trailerVideo = (data.videos?.results || []).find((v: any) => v.site === 'YouTube' && v.type === 'Trailer')
          || (data.videos?.results || []).find((v: any) => v.site === 'YouTube' && (v.type === 'Teaser' || v.type === 'Clip'));
        const trailerKey = trailerVideo?.key;
        const trailerUrl = trailerKey ? `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0` : undefined;

        return {
          id: `tmdb-movie-${data.id}`,
          title: data.title || data.original_title,
          genres: genres.length > 0 ? genres : ['Cinema', 'Drama'],
          releaseYear: isNaN(year) ? 2025 : year,
          posterUrl: data.poster_path ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}` : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
          backdropUrl: data.backdrop_path ? `${TMDB_IMAGE_BASE}/original${data.backdrop_path}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80',
          synopsis: data.overview || 'No synopsis recorded.',
          telegramPostId: `tmdb_movie_${data.id}`,
          telegramUrl: `https://t.me/orviaplay/movie_${data.id}`,
          playbackUrl: '',
          duration: `${runtimeH}h ${runtimeM}m`,
          rating: data.vote_average ? data.vote_average.toFixed(1) : '8.0',
          contentRating: 'PG-13',
          director,
          writers: writers.length > 0 ? writers : ['Screenplay Team'],
          cast,
          category: 'movies',
          availabilityLabel: 'CATALOG',
          hasFullMovie: false,
          hasTrailer: Boolean(trailerUrl),
          trailerUrl,
          trailerYoutubeKey: trailerKey,
          metadataProvider: 'tmdb',
        };
      }
    } catch (err: any) {
      console.warn('[TMDBAdapter] getDetails error:', err.message);
      return null;
    }
  }
}

export const tmdbAdapter = new TMDBAdapter();
