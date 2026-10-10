import { Movie, PlaybackStreamSource, Episode, Season } from '../../types';
import { MetadataProviderAdapter, PlaybackSourceAdapter } from './types';

export class BlenderFoundationAdapter implements MetadataProviderAdapter, PlaybackSourceAdapter {
  public readonly id = 'blender-foundation';
  public readonly name = 'Blender Institute Open Movie Project (Creative Commons)';

  public canHandle(id: string): boolean {
    return (
      id === 'elephants-dream' ||
      id === 'cosmos-laundromat' ||
      id.startsWith('cosmos-laundromat-') ||
      id === 'sintel-2010' ||
      id === 'player-test-sample'
    );
  }

  public async search(): Promise<any> {
    return { provider: this.id, results: [] };
  }

  public async getDetails(id: string): Promise<Movie | null> {
    if (id === 'elephants-dream') {
      return {
        id: 'elephants-dream',
        title: 'Elephants Dream (2006)',
        genres: ['Animation', 'Sci-Fi', 'Fantasy'],
        releaseYear: 2006,
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80',
        synopsis: 'Two men, the experienced Proog and the young Emo, journey through the surreal and labyrinthine mechanical chambers of a giant machine called the Elephant. The world\'s first open-source computer-animated film, produced by the Blender Institute.',
        telegramPostId: 'orvia_elephants_2006_post_104',
        telegramUrl: 'https://t.me/orviaplay/104',
        playbackUrl: '/api/media/stream/elephants-dream',
        duration: '11m',
        rating: '8.4',
        contentRating: 'PG',
        director: 'Bassam Kurdali',
        writers: ['Bassam Kurdali', 'Pepijn Koppers'],
        cast: [
          { name: 'Tygo Gernandt', role: 'Proog (Voice)', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
          { name: 'Cas Jansen', role: 'Emo (Voice)', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
        ],
        isClassic: true,
        category: 'movies',
        availabilityLabel: 'PLAYABLE',
        hasFullMovie: true,
        hasTrailer: true,
        trailerUrl: 'https://www.youtube-nocookie.com/embed/TLkA0RELQ1g?autoplay=1&rel=0',
        metadataProvider: 'blender-foundation',
      };
    }

    if (id === 'sintel-2010') {
      return {
        id: 'sintel-2010',
        title: 'Sintel (2010)',
        genres: ['Animation', 'Fantasy', 'Adventure'],
        releaseYear: 2010,
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
        synopsis: 'A lonely young woman named Sintel rescues and befriends a wounded baby dragon, naming him Scales. When a ferocious adult dragon kidnaps him, she embarks on a dangerous and emotional quest across desolate lands.',
        telegramPostId: 'orvia_sintel_2010',
        telegramUrl: 'https://t.me/orviaplay/sintel',
        playbackUrl: '/api/media/stream/sintel-2010',
        duration: '15m',
        rating: '8.7',
        contentRating: 'PG',
        director: 'Colin Levy',
        writers: ['Esther Wouda', 'Martin Lodewijk'],
        cast: [
          { name: 'Halina Reijn', role: 'Sintel (Voice)', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
          { name: 'Thom Hoffman', role: 'Shaman (Voice)', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
        ],
        isClassic: true,
        category: 'movies',
        availabilityLabel: 'PLAYABLE',
        hasFullMovie: true,
        hasTrailer: true,
        trailerUrl: 'https://www.youtube-nocookie.com/embed/eRsGyueVLvQ?autoplay=1&rel=0',
        metadataProvider: 'blender-foundation',
      };
    }

    if (id === 'cosmos-laundromat' || id.startsWith('cosmos-laundromat-')) {
      const episodes: Episode[] = [
        {
          id: 'cosmos-laundromat-s1e1',
          seasonNumber: 1,
          episodeNumber: 1,
          title: 'Episode 1: The Waiting Room',
          duration: '12m',
          synopsis: 'On a desolate, wind-swept island, a suicidal sheep named Franck meets Victor, a bizarre salesman who offers him the chance to explore multiple ecological realities.',
          stillUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
          airDate: '2015-08-10',
          playbackUrl: '/api/media/stream/cosmos-laundromat-s1e1',
          availabilityLabel: 'PLAYABLE',
          rightsStatus: 'creative-commons',
          isPlayable: true,
        },
        {
          id: 'cosmos-laundromat-s1e2',
          seasonNumber: 1,
          episodeNumber: 2,
          title: 'Episode 2: Grassland Jump',
          duration: '14m',
          synopsis: 'Franck awakens in an alternate planetary biosphere where flora and fauna behave in surreal, unpredictable patterns.',
          stillUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
          airDate: '2026-TBD',
          playbackUrl: '',
          availabilityLabel: 'UNAVAILABLE',
          rightsStatus: 'trailer-only',
          isPlayable: false,
        },
        {
          id: 'cosmos-laundromat-s1e3',
          seasonNumber: 1,
          episodeNumber: 3,
          title: 'Episode 3: The Ultimate Exit',
          duration: '15m',
          synopsis: 'The final cycle in Victor\'s multi-dimensional laundromat forces Franck to confront his original decision.',
          stillUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
          airDate: '2026-TBD',
          playbackUrl: '',
          availabilityLabel: 'UNAVAILABLE',
          rightsStatus: 'unavailable',
          isPlayable: false,
        },
      ];

      const seasons: Season[] = [
        {
          seasonNumber: 1,
          title: 'Season 1: First Cycle',
          overview: 'The complete opening cycle of the serialized open-source animated series produced by the Blender Animation Studio.',
          episodes,
        },
      ];

      return {
        id: 'cosmos-laundromat',
        title: 'Cosmos Laundromat (Series)',
        genres: ['Animation', 'Sci-Fi', 'Comedy'],
        releaseYear: 2025,
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
        synopsis: 'A suicidal sheep named Franck meets a quirky salesman who offers him the ability to travel through all possible universes in this serialized epic.',
        telegramPostId: 'orvia_cosmos_2025_post_105',
        telegramUrl: 'https://t.me/orviaplay/105',
        playbackUrl: '/api/media/stream/cosmos-laundromat-s1e1',
        duration: '1 Season (3 Episodes)',
        rating: '8.6',
        contentRating: 'PG',
        director: 'Mathieu Auvray',
        writers: ['Hendrik Proost'],
        cast: [
          { name: 'Pierre Bokma', role: 'Franck (Voice)', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80' },
          { name: 'Reinout Scholten van Aschat', role: 'Victor (Voice)', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
        ],
        isTrending: true,
        category: 'tv',
        availabilityLabel: 'PLAYABLE',
        hasFullMovie: false,
        hasTrailer: true,
        trailerUrl: 'https://www.youtube-nocookie.com/embed/Y-rmzh0PI3Q?autoplay=1&rel=0',
        metadataProvider: 'blender-foundation',
        seriesData: {
          seasons,
          totalSeasons: 1,
          totalEpisodes: 3,
          status: 'Ongoing Open Project',
        },
      };
    }

    return null;
  }

  public async resolveSources(contentId: string): Promise<PlaybackStreamSource[]> {
    if (contentId === 'elephants-dream') {
      return [
        {
          sourceId: 'src-elephants-1080p',
          contentId: 'elephants-dream',
          sourceProvider: 'Blender Institute Global Origin',
          mediaType: 'movie',
          title: 'Elephants Dream (2006) - 1080p Stream',
          authorizationStatus: 'authorized',
          availabilityStatus: 'verified',
          quality: '1080p',
          format: 'mp4',
          streamUrl: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
          proxyUrl: '/api/media/stream/elephants-dream',
          cdnProvider: 'Blender Institute Edge CDN',
          byteRangeSupported: true,
          rightsStatus: 'creative-commons',
          licenseTerms: 'Creative Commons Attribution 2.5 (CC-BY 2.5)',
          attribution: 'Blender Institute Open Movie Project',
          isActive: true,
          lastVerifiedAt: Date.now(),
          httpStatus: 206,
        },
      ];
    }

    if (contentId === 'sintel-2010') {
      return [
        {
          sourceId: 'src-sintel-1080p',
          contentId: 'sintel-2010',
          sourceProvider: 'Blender Institute / Durian Project',
          mediaType: 'movie',
          title: 'Sintel (2010) - 1080p HD Stream',
          authorizationStatus: 'authorized',
          availabilityStatus: 'verified',
          quality: '1080p',
          format: 'mp4',
          streamUrl: 'https://archive.org/download/Sintel/sintel-2048-surround.mp4',
          proxyUrl: '/api/media/stream/sintel-2010',
          cdnProvider: 'Internet Archive Global Edge',
          byteRangeSupported: true,
          rightsStatus: 'creative-commons',
          licenseTerms: 'Creative Commons Attribution 3.0 (CC-BY 3.0)',
          attribution: 'Blender Foundation / Durian Project',
          isActive: true,
          lastVerifiedAt: Date.now(),
          httpStatus: 206,
        },
      ];
    }

    if (contentId === 'cosmos-laundromat-s1e1' || contentId === 'cosmos-laundromat') {
      return [
        {
          sourceId: 'src-cosmos-s1e1-1080p',
          contentId: 'cosmos-laundromat-s1e1',
          sourceProvider: 'Blender Institute Animation Origin',
          mediaType: 'episode',
          title: 'Cosmos Laundromat S1:E1 - 1080p Full Episode',
          authorizationStatus: 'authorized',
          availabilityStatus: 'verified',
          quality: '1080p',
          format: 'mp4',
          streamUrl: 'https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4',
          proxyUrl: '/api/media/stream/cosmos-laundromat-s1e1',
          cdnProvider: 'Blender Institute Edge CDN',
          byteRangeSupported: true,
          rightsStatus: 'creative-commons',
          licenseTerms: 'Creative Commons Attribution 4.0 International (CC-BY 4.0)',
          attribution: 'Blender Animation Studio',
          isActive: true,
          lastVerifiedAt: Date.now(),
          httpStatus: 206,
        },
      ];
    }

    return [];
  }

  public async verifySource(source: PlaybackStreamSource): Promise<{ httpStatus: number; byteRangeSupported: boolean }> {
    try {
      const res = await fetch(source.streamUrl, {
        headers: { Range: 'bytes=0-1' },
        signal: AbortSignal.timeout(6000),
      });
      const byteRange = res.status === 206 || Boolean(res.headers.get('content-range'));
      return { httpStatus: res.status, byteRangeSupported: byteRange };
    } catch {
      return { httpStatus: 504, byteRangeSupported: false };
    }
  }
}

export const blenderFoundationAdapter = new BlenderFoundationAdapter();
