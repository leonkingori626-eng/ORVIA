import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Star, Play, Info, Film, Tv, Loader2 } from 'lucide-react';
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

  const genres = ['All', 'Sci-Fi', 'Action', 'Documentary', 'Drama', 'Crime', 'Animation', 'Adventure'];

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, selectedCategory, selectedGenre]);

  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchesQuery =
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.synopsis.toLowerCase().includes(query.toLowerCase()) ||
        m.genres.some((g) => g.toLowerCase().includes(query.toLowerCase()));
      
      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'movies' && m.category === 'movies') ||
        (selectedCategory === 'tv' && m.category === 'tv');

      const matchesGenre = selectedGenre === 'All' || m.genres.includes(selectedGenre);

      return matchesQuery && matchesCategory && matchesGenre;
    });
  }, [movies, query, selectedCategory, selectedGenre]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-4 sm:p-8 animate-fade-in overflow-y-auto text-[var(--text-main)]">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 pt-4">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl px-5 py-4 backdrop-blur-md shadow-2xl">
          <Search className="w-6 h-6 text-[var(--color-accent)]" />
          <input
            type="text"
            placeholder="Search movies, TV shows, series, genres..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] text-lg font-medium outline-none"
          />
          {isSearching && <Loader2 className="w-5 h-5 animate-spin text-[var(--color-accent)]" />}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-[var(--text-main)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Category Filter Tabs (All, Movies, TV Shows) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setSelectedCategory('movies')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'movies'
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Movies
          </button>
          <button
            onClick={() => setSelectedCategory('tv')}
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

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-12">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => {
                onSelectMovie(movie);
                onClose();
              }}
              className="flex gap-4 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--color-accent)] transition-all cursor-pointer group"
            >
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-16 h-24 rounded-lg object-cover bg-slate-900 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col justify-center overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-0.5">
                  {movie.category === 'tv' ? 'TV Series' : 'Movie'}
                </span>
                <h3 className="font-serif font-bold text-[var(--text-main)] text-sm truncate group-hover:text-[var(--color-accent)] transition-colors">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[var(--color-accent)] my-1">
                  <Star className="w-3.5 h-3.5 fill-[var(--color-accent)]" />
                  <span>{movie.rating}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[var(--text-muted)]">{movie.releaseYear}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2">{movie.synopsis}</p>
              </div>
            </div>
          ))}

          {filteredMovies.length === 0 && !isSearching && (
            <div className="col-span-full py-16 text-center">
              <p className="font-serif text-xl text-[var(--text-muted)]">No titles match your search criteria.</p>
              <p className="text-xs text-[var(--text-muted)]/60 mt-2">Try searching by another title, series name, or genre keyword.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
