import React from 'react';
import { X, Heart, Play, Trash2, Star } from 'lucide-react';
import { Movie } from '../types';

interface WatchlistModalProps {
  watchlistIds: string[];
  allMovies: Movie[];
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
  onPlayMovie: (movie: Movie) => void;
  onRemoveWatchlist: (movieId: string) => void;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  watchlistIds,
  allMovies,
  onClose,
  onSelectMovie,
  onPlayMovie,
  onRemoveWatchlist,
}) => {
  const watchlistedMovies = allMovies.filter((m) => watchlistIds.includes(m.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#0b0c10] border border-white/15 rounded-2xl overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.9)] p-6 sm:p-8 flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
              <Heart className="w-6 h-6 fill-[#d4af37]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-white text-xl">My Watchlist ({watchlistedMovies.length})</h2>
              <p className="text-xs text-white/50">Persisted locally across sessions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4">
          {watchlistedMovies.map((movie) => (
            <div
              key={movie.id}
              className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#d4af37]/50 transition-all group"
            >
              <div
                onClick={() => {
                  onSelectMovie(movie);
                  onClose();
                }}
                className="flex items-center gap-4 cursor-pointer overflow-hidden flex-1"
              >
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-16 h-22 rounded-lg object-cover bg-slate-900 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col overflow-hidden">
                  <h3 className="font-serif font-bold text-white text-base truncate group-hover:text-[#d4af37] transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#d4af37] my-1">
                    <Star className="w-3.5 h-3.5 fill-[#d4af37]" />
                    <span>{movie.rating}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-white/60">{movie.releaseYear}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-white/60">{movie.duration}</span>
                  </div>
                  <p className="text-xs text-white/50 line-clamp-1">{movie.synopsis}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    onPlayMovie(movie);
                    onClose();
                  }}
                  className="p-3 rounded-full bg-[#d4af37] text-black hover:bg-amber-400 transition-colors shadow-lg"
                  title="Watch Now"
                >
                  <Play className="w-4 h-4 fill-black" />
                </button>
                <button
                  onClick={() => onRemoveWatchlist(movie.id)}
                  className="p-3 rounded-full bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-400 border border-white/10 transition-colors"
                  title="Remove from Watchlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {watchlistedMovies.length === 0 && (
            <div className="py-16 text-center">
              <Heart className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="font-serif text-xl text-white/60">Your watchlist is currently empty.</p>
              <p className="text-xs text-white/40 mt-1">Explore the catalog and tap the heart icon to save titles here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
