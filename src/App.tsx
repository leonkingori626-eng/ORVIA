import React, { useState, useEffect, useMemo } from 'react';
import { getEnrichedMovies, fetchCatalogAsync } from './services/contentRegistry';
import { Movie, ContinueItem } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MovieRow } from './components/MovieRow';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { VideoPlayer } from './components/VideoPlayer';
import { SearchModal } from './components/SearchModal';
import { DownloadsModal } from './components/DownloadsModal';
import { WatchlistModal } from './components/WatchlistModal';
import { SettingsModal } from './components/SettingsModal';
import { SourcesAuditModal } from './components/SourcesAuditModal';
import { Footer } from './components/Footer';
import { Play, Star, Heart, Download, Info, AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [moviesCatalog, setMoviesCatalog] = useState<Movie[]>(getEnrichedMovies());
  const [catalogSource, setCatalogSource] = useState<string>('local-initial');
  const [catalogMessage, setCatalogMessage] = useState<string>('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  useEffect(() => {
    fetchCatalogAsync().then(({ movies, source, message }) => {
      setMoviesCatalog(movies);
      setCatalogSource(source);
      if (message) setCatalogMessage(message);
      setIsLoadingCatalog(false);
    });
  }, []);

  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [downloadMovie, setDownloadMovie] = useState<Movie | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const [theme, setTheme] = useState<'grove' | 'night' | 'mist'>(() => {
    try {
      const saved = localStorage.getItem('orvia_theme');
      return (saved === 'night' || saved === 'mist' || saved === 'grove') ? saved : 'mist';
    } catch {
      return 'mist';
    }
  });

  useEffect(() => {
    localStorage.setItem('orvia_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persistence in localStorage
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('orvia_watchlist');
      return saved ? JSON.parse(saved) : ['celestia-echoes', 'neo-samurai'];
    } catch {
      return ['celestia-echoes', 'neo-samurai'];
    }
  });

  const [continueWatching, setContinueWatching] = useState<ContinueItem[]>(() => {
    try {
      const saved = localStorage.getItem('orvia_continue_watching');
      return saved ? JSON.parse(saved) : [{ movieId: 'celestia-echoes', progressSeconds: 1250, totalDurationSeconds: 9480, lastWatched: Date.now() }];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('orvia_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('orvia_continue_watching', JSON.stringify(continueWatching));
  }, [continueWatching]);

  const handleToggleWatchlist = (movieId: string) => {
    setWatchlist((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );
  };

  const handleUpdateProgress = (movieId: string, progress: number, total: number) => {
    setContinueWatching((prev) => {
      const existing = prev.find((item) => item.movieId === movieId);
      if (existing) {
        return prev.map((item) =>
          item.movieId === movieId
            ? { ...item, progressSeconds: progress, totalDurationSeconds: total, lastWatched: Date.now() }
            : item
        );
      }
      return [{ movieId, progressSeconds: progress, totalDurationSeconds: total, lastWatched: Date.now() }, ...prev];
    });
  };

  const continueWatchingMovies = continueWatching
    .map((item) => ({
      movie: moviesCatalog.find((m) => m.id === item.movieId),
      progress: item,
    }))
    .filter((x): x is { movie: Movie; progress: ContinueItem } => x.movie !== undefined);

  const trendingMovies = moviesCatalog.filter((m) => m.isTrending || m.rating >= '8.0');
  const popularMovies = moviesCatalog.filter((m) => m.isPopular || m.category === 'movies');
  const tvSeriesList = moviesCatalog.filter((m) => m.category === 'tv');
  const sciFiMovies = moviesCatalog.filter((m) => m.genres.includes('Sci-Fi'));
  const actionMovies = moviesCatalog.filter((m) => m.genres.includes('Action'));
  const documentaryMovies = moviesCatalog.filter((m) => m.category === 'documentary' || m.genres.includes('Documentary'));
  const classicMovies = moviesCatalog.filter((m) => m.isClassic || m.releaseYear <= 2024);

  const featuredMovie = moviesCatalog[0] || moviesCatalog[1];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans antialiased transition-colors duration-300">
      
      {/* TMDB / Catalog Diagnostic Banner if fallback is active */}
      {catalogMessage && (
        <div className="bg-[var(--color-primary)] text-white px-4 py-2 text-xs flex items-center justify-center gap-2 border-b border-[var(--border-color)]">
          <Info className="w-4 h-4 shrink-0 text-[var(--color-accent)]" />
          <span>{catalogMessage} (Tip: Configure <strong>TMDB_API_KEY</strong> in Google AI Studio Secrets/settings for live TMDB sync).</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenWatchlist={() => setWatchlistOpen(true)}
        onOpenDownloads={() => setDownloadsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSources={() => setSourcesOpen(true)}
        watchlistCount={watchlist.length}
      />

      {/* Loading Spinner for Catalog */}
      {isLoadingCatalog && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
          <span className="ml-3 font-serif text-sm">Loading ORVIA Grove Catalog...</span>
        </div>
      )}

      {/* Main Content Area based on Active Tab */}
      {!isLoadingCatalog && (
        <main className="pb-16">
          {activeTab === 'home' && featuredMovie && (
            <>
              <Hero
                movie={featuredMovie}
                onPlay={(m) => setPlayingMovie(m)}
                onMoreInfo={(m) => setSelectedMovie(m)}
                onToggleWatchlist={handleToggleWatchlist}
                isWatchlisted={watchlist.includes(featuredMovie.id)}
                onOpenDownload={(m) => setDownloadMovie(m)}
              />

              {/* Continue Watching Section */}
              {continueWatchingMovies.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-2xl font-bold tracking-tight">Continue Watching</h2>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                    {continueWatchingMovies.map(({ movie, progress }) => {
                      const percent = Math.min(100, Math.round((progress.progressSeconds / progress.totalDurationSeconds) * 100));
                      return (
                        <div
                          key={movie.id}
                          onClick={() => setSelectedMovie(movie)}
                          className="group relative flex-none w-[240px] sm:w-[280px] rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--color-accent)] cursor-pointer transition-all hover:scale-105"
                        >
                          <div className="aspect-[16/9] w-full relative bg-slate-900">
                            <img
                              src={movie.backdropUrl}
                              alt={movie.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlayingMovie(movie);
                                }}
                                className="p-3 rounded-full bg-[var(--color-primary)] text-white shadow-lg hover:scale-110 transition-transform"
                              >
                                <Play className="w-5 h-5 fill-white" />
                              </button>
                            </div>
                            {/* Progress bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                              <div className="h-full bg-[var(--color-accent)]" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                          <div className="p-3 bg-[var(--bg-card)] flex items-center justify-between">
                            <div>
                              <h4 className="font-serif font-semibold text-sm truncate">{movie.title}</h4>
                              <span className="text-[11px] text-[var(--color-accent)]">{percent}% completed</span>
                            </div>
                            <span className="text-xs text-[var(--text-muted)]">{movie.duration}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <MovieRow
                title="Trending Now"
                movies={trendingMovies}
                onSelectMovie={(m) => setSelectedMovie(m)}
                onPlayMovie={(m) => setPlayingMovie(m)}
                onToggleWatchlist={handleToggleWatchlist}
                watchlist={watchlist}
              />

              <MovieRow
                title="Popular Movies"
                movies={popularMovies}
                onSelectMovie={(m) => setSelectedMovie(m)}
                onPlayMovie={(m) => setPlayingMovie(m)}
                onToggleWatchlist={handleToggleWatchlist}
                watchlist={watchlist}
              />

              <MovieRow
                title="Television Series & Shows"
                movies={tvSeriesList}
                onSelectMovie={(m) => setSelectedMovie(m)}
                onPlayMovie={(m) => setPlayingMovie(m)}
                onToggleWatchlist={handleToggleWatchlist}
                watchlist={watchlist}
              />

              <MovieRow
                title="Science Fiction & Space"
                movies={sciFiMovies}
                onSelectMovie={(m) => setSelectedMovie(m)}
                onPlayMovie={(m) => setPlayingMovie(m)}
                onToggleWatchlist={handleToggleWatchlist}
                watchlist={watchlist}
              />

              <MovieRow
                title="Action & Adventure"
                movies={actionMovies}
                onSelectMovie={(m) => setSelectedMovie(m)}
                onPlayMovie={(m) => setPlayingMovie(m)}
                onToggleWatchlist={handleToggleWatchlist}
                watchlist={watchlist}
              />

              <MovieRow
                title="Documentaries & Abyss"
                movies={documentaryMovies}
                onSelectMovie={(m) => setSelectedMovie(m)}
                onPlayMovie={(m) => setPlayingMovie(m)}
                onToggleWatchlist={handleToggleWatchlist}
                watchlist={watchlist}
              />

              <MovieRow
                title="ORVIA Classics & Noir"
                movies={classicMovies}
                onSelectMovie={(m) => setSelectedMovie(m)}
                onPlayMovie={(m) => setPlayingMovie(m)}
                onToggleWatchlist={handleToggleWatchlist}
                watchlist={watchlist}
              />
            </>
          )}

          {activeTab === 'movies' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">Cinematic Movies</h1>
              <p className="text-sm text-[var(--text-muted)] mb-8">Explore our full catalog of feature-length films and authorized streams.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {moviesCatalog.filter(m => m.category === 'movies').map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="group rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--color-accent)] cursor-pointer transition-all hover:scale-105"
                  >
                    <div className="aspect-[3/4] w-full bg-slate-900 relative">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/70 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[var(--color-accent)] text-[var(--color-accent)]" /> {movie.rating}
                      </div>
                    </div>
                    <div className="p-3 bg-[var(--bg-card)]">
                      <h3 className="font-serif font-semibold text-sm truncate">{movie.title}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{movie.releaseYear} · {movie.genres[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tv' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">TV Shows & Series</h1>
              <p className="text-sm text-[var(--text-muted)] mb-8">Immersive serialized storytelling and animated epics.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {moviesCatalog.filter(m => m.category === 'tv').map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="group rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--color-accent)] cursor-pointer transition-all hover:scale-105"
                  >
                    <div className="aspect-[3/4] w-full bg-slate-900 relative">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/70 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[var(--color-accent)] text-[var(--color-accent)]" /> {movie.rating}
                      </div>
                    </div>
                    <div className="p-3 bg-[var(--bg-card)]">
                      <h3 className="font-serif font-semibold text-sm truncate">{movie.title}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{movie.releaseYear} · {movie.genres[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documentary' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">Documentaries</h1>
              <p className="text-sm text-[var(--text-muted)] mb-8">Deep dives into science, nature, and the final frontiers of discovery.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {moviesCatalog.filter(m => m.category === 'documentary').map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="group rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--color-accent)] cursor-pointer transition-all hover:scale-105"
                  >
                    <div className="aspect-[3/4] w-full bg-slate-900 relative">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/70 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[var(--color-accent)] text-[var(--color-accent)]" /> {movie.rating}
                      </div>
                    </div>
                    <div className="p-3 bg-[var(--bg-card)]">
                      <h3 className="font-serif font-semibold text-sm truncate">{movie.title}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{movie.releaseYear} · {movie.genres[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'classics' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">ORVIA Classics</h1>
              <p className="text-sm text-[var(--text-muted)] mb-8">Verified public-domain masterpieces and timeless cinematic cinema.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {moviesCatalog.filter(m => m.isClassic || m.releaseYear <= 2024).map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="group rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--color-accent)] cursor-pointer transition-all hover:scale-105"
                  >
                    <div className="aspect-[3/4] w-full bg-slate-900 relative">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/70 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[var(--color-accent)] text-[var(--color-accent)]" /> {movie.rating}
                      </div>
                    </div>
                    <div className="p-3 bg-[var(--bg-card)]">
                      <h3 className="font-serif font-semibold text-sm truncate">{movie.title}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{movie.releaseYear} · {movie.genres[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <Footer />

      {/* Modals & Overlays */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={(m, overrideUrl, ep) => {
            if (ep) {
              const epId = ep.id || `${m.id}-s1e${ep.episodeNumber}`;
              setPlayingMovie({
                ...m,
                id: epId,
                title: `${m.title} — ${ep.title}`,
                playbackUrl: overrideUrl || ep.playbackUrl,
                availabilityLabel: ep.availabilityLabel,
                duration: ep.duration,
                synopsis: ep.synopsis,
              });
            } else {
              setPlayingMovie(overrideUrl ? { ...m, playbackUrl: overrideUrl } : m);
            }
          }}
          onToggleWatchlist={handleToggleWatchlist}
          isWatchlisted={watchlist.includes(selectedMovie.id)}
          onOpenDownload={(m) => setDownloadMovie(m)}
          onSelectMovie={(m) => setSelectedMovie(m)}
          allMovies={moviesCatalog}
        />
      )}

      {playingMovie && (
        <VideoPlayer
          movie={playingMovie}
          onClose={() => setPlayingMovie(null)}
          onUpdateProgress={handleUpdateProgress}
          initialProgress={continueWatching.find((c) => c.movieId === playingMovie.id)?.progressSeconds || 0}
        />
      )}

      {searchOpen && (
        <SearchModal
          movies={moviesCatalog}
          onClose={() => setSearchOpen(false)}
          onSelectMovie={(m) => setSelectedMovie(m)}
          onPlayMovie={(m) => setPlayingMovie(m)}
        />
      )}

      {watchlistOpen && (
        <WatchlistModal
          watchlistIds={watchlist}
          allMovies={moviesCatalog}
          onClose={() => setWatchlistOpen(false)}
          onSelectMovie={(m) => setSelectedMovie(m)}
          onPlayMovie={(m) => setPlayingMovie(m)}
          onRemoveWatchlist={handleToggleWatchlist}
        />
      )}

      {(downloadsOpen || downloadMovie) && (
        <DownloadsModal
          movieToDownload={downloadMovie}
          allMovies={moviesCatalog}
          onClose={() => {
            setDownloadsOpen(false);
            setDownloadMovie(null);
          }}
        />
      )}

      {sourcesOpen && (
        <SourcesAuditModal
          movies={moviesCatalog}
          onClose={() => setSourcesOpen(false)}
          onPlayTestSample={(sample) => {
            setSourcesOpen(false);
            setPlayingMovie(sample);
          }}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          currentTheme={theme}
          setTheme={setTheme}
        />
      )}

    </div>
  );
}
