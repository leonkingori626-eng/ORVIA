import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Star, Play, Info, Film, Tv, Loader2, AlertCircle, RefreshCw, FilterX } from 'lucide-react';
import { Movie } from '../types';

interface SearchModalProps {
  movies: Movie[];
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
  onPlayMovie: (movie: Movie) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  movies,
  onClose,
  onSelectMovie,
  onPlayMovie,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'movies' | 'tv'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [providerSource, setProviderSource] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const genres = ['All', 'Action', 'Drama', 'Crime', 'Sci-Fi', 'Documentary', 'Animation', 'Adventure', 'Mystery', 'Comedy', 'Thriller'];

  // Handle ESC key to dismiss modal cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const performSearch = async (searchQuery: string, category: string) => {
    const trimmed = searchQuery.trim().replace(/\s+/g, ' ');
    if (!trimmed) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      setSearchError(null);
      setProviderSource(null);
      return;
    }

    // Cancel any previous in-flight search request to prevent stale overwrite
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&type=${category}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Search provider returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setSearchResults(data.results || []);
      setProviderSource(data.source || 'verified-provider');
      setHasSearched(true);
      setIsSearching(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Ignored: cancelled by newer in-flight request
        return;
      }
      console.warn('[SearchModal] Search error:', err.message);
      setSearchError('Catalog search service temporarily unavailable. Please check your connection or retry.');
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query, selectedCategory);
    }, 240);

    return () => {
      clearTimeout(timer);
    };
  }, [query, selectedCategory]);

  const handleCategoryChange = (newCat: 'all' | 'movies' | 'tv') => {
    setSelectedCategory(newCat);
    if (query.trim()) {
      performSearch(query, newCat);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setIsSearching(false);
    setSearchError(null);
    setSelectedGenre('All');
  };

  // Helper: Match genres flexibly with support for composite genres (e.g. Action & Adventure)
  const matchGenre = (genreList: string[] = [], target: string) => {
    if (target === 'All') return true;
    const targetLower = target.toLowerCase();
    return genreList.some((g) => {
      const gl = g.toLowerCase();
      return gl === targetLower || gl.includes(targetLower) || targetLower.includes(gl);
    });
  };

  // When query is empty, show default catalog items as suggestions; otherwise show search results
  const displayedMovies = hasSearched ? searchResults : movies;

  // Filter by genre pills
  const filteredMovies = useMemo(() => {
    return displayedMovies.filter((m) => matchGenre(m.genres, selectedGenre));
  }, [displayedMovies, selectedGenre]);

  const isGenreFilteredOut = hasSearched && searchResults.length > 0 && filteredMovies.length === 0 && selectedGenre !== 'All';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-4 sm:p-8 animate-fade-in overflow-y-auto text-[var(--text-main)]">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 pt-4">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl px-5 py-4 backdrop-blur-md shadow-2xl">
          <Search className="w-6 h-6 text-[var(--color-accent)] shrink-0" />
          <input
            type="text"
            placeholder="Search movies, TV series (e.g. Prison Break, Breaking Bad, Inception)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] text-lg font-medium outline-none"
          />
          {isSearching && <Loader2 className="w-5 h-5 animate-spin text-[var(--color-accent)] shrink-0" />}
          {query && (
            <button
              onClick={handleClear}
              className="p-1 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-[var(--text-main)] transition-colors shrink-0"
            title="Close Search (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Category Filter Tabs (All, Movies, TV Shows) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => handleCategoryChange('movies')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'movies'
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Movies
          </button>
          <button
            onClick={() => handleCategoryChange('tv')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'tv'
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
            }`}
          >
            <Tv className="w-3.5 h-3.5" /> TV Shows & Series
          </button>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGenre === genre
                  ? 'bg-[var(--color-accent)] text-black shadow-md'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-white/10 border border-[var(--border-color)]'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Search Status & Query Header */}
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
          {hasSearched ? (
            <div className="flex items-center gap-2">
              <span>Found <strong>{searchResults.length}</strong> {searchResults.length === 1 ? 'title' : 'titles'} for &ldquo;{query}&rdquo;</span>
              {selectedGenre !== 'All' && (
                <span className="text-[var(--color-accent)]">· Filtered by {selectedGenre} ({filteredMovies.length} shown)</span>
              )}
            </div>
          ) : (
            <span>Popular & Suggested Titles in Catalog</span>
          )}
          {isSearching && (
            <span className="flex items-center gap-1.5 text-[var(--color-accent)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Querying catalog providers...
            </span>
          )}
        </div>

        {/* Genre Filter Reset Notice if active filter hides all results */}
        {isGenreFilteredOut && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200 flex items-center justify-between text-xs">
            <span>No <strong>{selectedGenre}</strong> titles match &ldquo;{query}&rdquo;. Found {searchResults.length} matching titles in other genres.</span>
            <button
              onClick={() => setSelectedGenre('All')}
              className="px-3 py-1 bg-amber-600/30 hover:bg-amber-600/50 rounded-lg text-white font-bold transition-colors"
            >
              Show all genres
            </button>
          </div>
        )}

        {/* Error Banner State */}
        {searchError && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-300 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{searchError}</span>
            </div>
            <button
              onClick={() => performSearch(query, selectedCategory)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-xs text-white font-semibold transition-colors shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-12">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => {
                onSelectMovie(movie);
                onClose();
              }}
              className="flex gap-4 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--color-accent)] transition-all cursor-pointer group shadow-sm hover:shadow-lg"
            >
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-16 h-24 rounded-lg object-cover bg-slate-900 shrink-0 border border-white/5"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] truncate">
                    {movie.category === 'tv' ? 'TV Series' : 'Movie'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                    movie.availabilityLabel === 'PLAYABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}>
                    {movie.availabilityLabel}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-[var(--text-main)] text-sm truncate group-hover:text-[var(--color-accent)] transition-colors">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[var(--color-accent)] my-1">
                  <Star className="w-3.5 h-3.5 fill-[var(--color-accent)]" />
                  <span>{movie.rating}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[var(--text-muted)]">{movie.releaseYear}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{movie.synopsis}</p>
              </div>
            </div>
          ))}

          {/* Genuine Zero-Results State */}
          {hasSearched && searchResults.length === 0 && !isSearching && !searchError && (
            <div className="col-span-full py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center mx-auto mb-3 text-[var(--color-accent)]">
                <Search className="w-5 h-5" />
              </div>
              <p className="font-serif text-xl font-bold text-[var(--text-main)]">No titles match &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-[var(--text-muted)] mt-2 max-w-sm mx-auto">
                No matching movies or TV series were found by catalog providers. Try checking the spelling, searching by alternative keywords, or switching category filters.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

