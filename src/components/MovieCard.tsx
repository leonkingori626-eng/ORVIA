import React, { useState } from 'react';
import { Play, Heart, Info, Star } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
  onToggleWatchlist: (movieId: string) => void;
  isWatchlisted: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelect,
  onPlay,
  onToggleWatchlist,
  isWatchlisted,
}) => {
  const [imageError, setImageError] = useState(false);

  // Determine clean badge (Never show "TRAILER ONLY")
  const renderCardBadge = () => {
    if (movie.category === 'tv') {
      return (
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md bg-indigo-500/80 text-white">
          Series
        </div>
      );
    }
    if (movie.availabilityLabel === 'PLAYABLE') {
      return (
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md bg-emerald-500/85 text-black">
          Stream
        </div>
      );
    }
    if (movie.isClassic) {
      return (
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md bg-amber-500/80 text-black">
          Classic
        </div>
      );
    }
    return null;
  };

  return (
    <div
      onClick={() => onSelect(movie)}
      className="group relative flex-none w-[200px] sm:w-[220px] rounded-xl overflow-hidden bg-white/5 border border-white/10 transition-all duration-300 hover:scale-105 hover:border-[#d4af37]/50 hover:shadow-[0_10px_30px_rgba(0,0,0,0.8)] cursor-pointer"
    >
      {/* Poster Image */}
      <div className="aspect-[3/4] w-full overflow-hidden bg-slate-900 relative">
        {!imageError ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-center">
            <span className="font-serif font-bold text-white text-lg">{movie.title}</span>
            <span className="text-xs text-[#d4af37] mt-2">ORVIA Cinema</span>
          </div>
        )}

        {/* Content Type / Stream Badge */}
        {renderCardBadge()}

        {/* Rating Badge */}
        <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
          <Star className="w-3.5 h-3.5 fill-[#d4af37] text-[#d4af37]" />
          <span className="text-xs font-bold text-white">{movie.rating}</span>
        </div>

        {/* Hover Overlay Action Bar */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex items-center gap-2 mb-2">
            {movie.availabilityLabel === 'PLAYABLE' || movie.availabilityLabel === 'EXTERNAL VIEWING' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(movie);
                }}
                className="p-2.5 rounded-full bg-[#d4af37] text-black hover:bg-amber-400 transition-colors shadow-lg"
                title={movie.category === 'tv' ? 'Watch Episode' : 'Watch Movie'}
              >
                <Play className="w-4 h-4 fill-black" />
              </button>
            ) : (movie.hasTrailer || movie.trailerUrl) ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay({ ...movie, isTrailerPlayback: true, playbackUrl: movie.trailerUrl || '' });
                }}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/25 transition-colors shadow-lg"
                title="Watch Trailer"
              >
                <Play className="w-4 h-4 fill-white" />
              </button>
            ) : null}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(movie.id);
              }}
              className={`p-2.5 rounded-full backdrop-blur-md border transition-colors ${
                isWatchlisted
                  ? 'bg-[#d4af37] text-black border-[#d4af37]'
                  : 'bg-black/50 text-white border-white/20 hover:bg-black/80'
              }`}
              title="Watchlist"
            >
              <Heart className={`w-4 h-4 ${isWatchlisted ? 'fill-black' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(movie);
              }}
              className="p-2.5 rounded-full bg-black/50 text-white border border-white/20 hover:bg-black/80 transition-colors"
              title="Details"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <h3 className="font-serif font-bold text-white text-sm line-clamp-1">{movie.title}</h3>
          
          <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
            <span>{movie.releaseYear}</span>
            <span aria-hidden="true">·</span>
            <span>{movie.genres[0]}</span>
            <span aria-hidden="true">·</span>
            <span>{movie.contentRating}</span>
          </div>
        </div>
      </div>

      {/* Static title under card */}
      <div className="p-3 bg-[#0b0c10]">
        <h4 className="font-serif font-semibold text-white text-sm truncate">{movie.title}</h4>
        <p className="text-xs text-white/50 truncate mt-0.5">{movie.genres.join(', ')}</p>
      </div>
    </div>
  );
};
