import { Movie } from '../types';

export const MOVIES_DATABASE: Movie[] = [
  {
    id: 'night-of-the-living-dead',
    title: 'Night of the Living Dead (1968)',
    genres: ['Horror', 'Mystery', 'Classic'],
    releaseYear: 1968,
    posterUrl: '/src/assets/images/poster_classic_metropolis_1791548891044.jpg',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    synopsis: 'A group of desperate survivors barricade themselves inside a rural farmhouse to withstand an onslaught of reanimated, flesh-eating ghouls. George A. Romero\'s groundbreaking, full-length 96-minute public domain horror masterpiece.',
    telegramPostId: 'orvia_notld_1968_post_100',
    telegramUrl: 'https://t.me/orviaplay/100',
    playbackUrl: '/api/media/stream/night-of-the-living-dead',
    duration: '1h 36m',
    rating: '8.8',
    contentRating: 'Not Rated',
    director: 'George A. Romero',
    writers: ['George A. Romero', 'John Russo'],
    cast: [
      { name: 'Duane Jones', role: 'Ben', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
      { name: 'Judith O\'Dea', role: 'Barbra', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
      { name: 'Karl Hardman', role: 'Harry Cooper', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' }
    ],
    isFeatured: true,
    isTrending: true,
    isPopular: true,
    isClassic: true,
    category: 'movies',
    availabilityLabel: 'PLAYABLE'
  },
  {
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
      { name: 'Cas Jansen', role: 'Emo (Voice)', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' }
    ],
    isClassic: true,
    isPopular: true,
    category: 'movies',
    availabilityLabel: 'PLAYABLE'
  },
  {
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
    duration: '1 Season',
    rating: '8.6',
    contentRating: 'PG',
    director: 'Mathieu Auvray',
    writers: ['Hendrik Proost'],
    cast: [
      { name: 'Pierre Bokma', role: 'Franck (Voice)', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80' },
      { name: 'Reinout Scholten van Aschat', role: 'Victor (Voice)', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' }
    ],
    isTrending: true,
    category: 'tv',
    availabilityLabel: 'PLAYABLE',
    seriesData: {
      seasons: [
        {
          seasonNumber: 1,
          title: 'Season 1: First Cycle',
          episodes: [
            { episodeNumber: 1, title: 'Episode 1: The Waiting Room', duration: '12m', synopsis: 'Franck arrives at a desolate island and meets Victor.', playbackUrl: '/api/media/stream/cosmos-laundromat-s1e1', availabilityLabel: 'PLAYABLE' },
            { episodeNumber: 2, title: 'Episode 2: Grassland Jump', duration: '14m', synopsis: 'Travelling across alternate ecological universes.', playbackUrl: '', availabilityLabel: 'TRAILER ONLY' },
            { episodeNumber: 3, title: 'Episode 3: The Ultimate Exit', duration: '15m', synopsis: 'The final decision in the multidimensional laundromat.', playbackUrl: '', availabilityLabel: 'UNAVAILABLE' }
          ]
        }
      ]
    }
  },
  {
    id: 'celestia-echoes',
    title: 'Celestia: Echoes of Orion',
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    releaseYear: 2026,
    posterUrl: '/src/assets/images/poster_interstellar_odyssey_1791548847775.jpg',
    backdropUrl: '/src/assets/images/backdrop_dune_planet_1791548857077.jpg',
    synopsis: 'In a universe without limits, an astronaut stands on an alien red planet gazing at a colossal ringed giant, embarking on a monumental voyage across space-time to secure humanity\'s future.',
    telegramPostId: 'orvia_celestia_2026_post_101',
    telegramUrl: 'https://t.me/orviaplay/101',
    playbackUrl: '',
    duration: '2h 38m',
    rating: '8.9',
    contentRating: 'PG-13',
    director: 'Elena Moretti',
    writers: ['Elena Moretti', 'Samuel Johnson'],
    cast: [
      { name: 'Alexa Reed', role: 'Commander Kara Vance', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
      { name: 'David Kim', role: 'Dr. Orion Thorne', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
      { name: 'Eliza Vance', role: 'Navigator Sola', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80' }
    ],
    isTrending: true,
    isPopular: true,
    isNew: true,
    category: 'movies',
    availabilityLabel: 'TRAILER ONLY'
  },
  {
    id: 'neo-samurai',
    title: 'Neo-Samurai: Cyberpunk Shadows',
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    releaseYear: 2025,
    posterUrl: '/src/assets/images/poster_cyber_ronin_1791548866721.jpg',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    synopsis: 'In a city built on lies and neon rain, a rogue augmented ronin wielding a plasma katana fights corrupt corporate syndicates to uncover the ultimate digital truth.',
    telegramPostId: 'orvia_neosamurai_2025_post_102',
    telegramUrl: 'https://t.me/orviaplay/102',
    playbackUrl: '',
    duration: '1h 54m',
    rating: '8.4',
    contentRating: 'R',
    director: 'Akira Tanaka',
    writers: ['Kenji Sato', 'Maya Lin'],
    cast: [
      { name: 'Hiroshi Sato', role: 'Kenshin Zero', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
      { name: 'Yuki R.', role: 'Cipher Nine', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80' }
    ],
    isTrending: true,
    isPopular: true,
    isNew: true,
    category: 'movies',
    availabilityLabel: 'TRAILER ONLY'
  },
  {
    id: 'abyss-into-trenches',
    title: 'Abyss: Into the Trenches',
    genres: ['Documentary', 'Adventure', 'Science'],
    releaseYear: 2026,
    posterUrl: '/src/assets/images/poster_ocean_mysteries_1791548879722.jpg',
    backdropUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&auto=format&fit=crop&q=80',
    synopsis: 'A breathtaking deep-sea documentary journey into the uncharted Mariana Trench, discovering luminous biological wonders and submarine exploration limits.',
    telegramPostId: 'orvia_abyss_2026_post_103',
    telegramUrl: 'https://t.me/orviaplay/103',
    playbackUrl: '',
    duration: '1h 42m',
    rating: '9.1',
    contentRating: 'G',
    director: 'Kai Larsen',
    writers: ['Liam Neeson', 'Kai Larsen'],
    cast: [
      { name: 'Dr. Aris Thorne', role: 'Chief Oceanographer', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80' }
    ],
    isTrending: true,
    isPopular: true,
    isNew: true,
    category: 'documentary',
    availabilityLabel: 'TRAILER ONLY'
  },
  {
    id: 'for-bigger-blazes',
    title: 'For Bigger Blazes',
    genres: ['Action', 'Adventure'],
    releaseYear: 2026,
    posterUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&auto=format&fit=crop&q=80',
    synopsis: 'High-octane stunt drivers and wildfire rescue teams race against time across rugged canyons and mountainous terrain.',
    telegramPostId: 'orvia_blazes_2026_post_106',
    telegramUrl: 'https://t.me/orviaplay/106',
    playbackUrl: '',
    duration: '15m',
    rating: '7.8',
    contentRating: 'PG-13',
    director: 'Google Chrome',
    writers: ['Studio Team'],
    cast: [
      { name: 'Chris Evans', role: 'Driver Lead', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' }
    ],
    isNew: true,
    category: 'movies',
    availabilityLabel: 'TRAILER ONLY'
  },
  {
    id: 'we-are-going-on-bullrun',
    title: 'Bullrun: Midnight Chase',
    genres: ['Action', 'Crime', 'Thriller'],
    releaseYear: 2025,
    posterUrl: 'https://images.unsplash.com/photo-1541447271487-09612b3f49f7?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=1600&auto=format&fit=crop&q=80',
    synopsis: 'The ultimate underground supercars rally across European highways under police surveillance and high-stakes wagers.',
    telegramPostId: 'orvia_bullrun_2025_post_107',
    telegramUrl: 'https://t.me/orviaplay/107',
    playbackUrl: '',
    duration: '18m',
    rating: '8.0',
    contentRating: 'PG-13',
    director: 'Speedway Media',
    writers: ['Alex Vance'],
    cast: [
      { name: 'Marcus Brody', role: 'Driver #7', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' }
    ],
    isPopular: true,
    category: 'movies',
    availabilityLabel: 'EXTERNAL VIEWING'
  },
  {
    id: 'sub-zero-summit',
    title: 'Sub-Zero Summit',
    genres: ['Documentary', 'Adventure'],
    releaseYear: 2026,
    posterUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1600&auto=format&fit=crop&q=80',
    synopsis: 'Mountaineers push past physiological boundaries to scale the unconquered winter ridge of K2 in sub-zero blizzards.',
    telegramPostId: 'orvia_subzero_2026_post_108',
    telegramUrl: 'https://t.me/orviaplay/108',
    playbackUrl: '',
    duration: '1h 20m',
    rating: '8.8',
    contentRating: 'PG',
    director: 'Alpine Guild',
    writers: ['Hillary Scott'],
    cast: [
      { name: 'Tenzin Norbu', role: 'Lead Guide', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80' }
    ],
    isNew: true,
    category: 'documentary',
    availabilityLabel: 'UNAVAILABLE'
  }
];

export const PLAYER_TEST_SAMPLE: Movie = {
  id: 'player-test-sample',
  title: 'ORVIA Player Diagnostic Benchmark (Test Mode)',
  genres: ['Diagnostic', 'Animation', 'Benchmark'],
  releaseYear: 2026,
  posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80',
  synopsis: 'Explicit player engine diagnostic test mode using authorized Blender Foundation Creative Commons benchmark media. Used to verify byte-range streaming, HTML5 video decoders, and playback telemetry without affecting production catalog integrity.',
  telegramPostId: 'test_sample_0',
  telegramUrl: 'https://t.me/orviaplay/test',
  playbackUrl: '/api/media/stream/player-test-sample',
  duration: '11m',
  rating: '10.0',
  contentRating: 'G',
  director: 'Blender Foundation',
  writers: ['Diagnostics Engine'],
  cast: [],
  category: 'movies',
  availabilityLabel: 'PLAYABLE'
};

