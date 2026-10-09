import React from 'react';
import { Play, Info, Heart, Star, Download, Sparkles } from 'lucide-react';
import { Movie } from '../types';

interface HeroProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onMoreInfo: (movie: Movie) => void;
  onToggleWatchlist: (movieId: string) => void;
  isWatchlisted: boolean;
  onOpenDownload: (movie: Movie) => void;
}

export const Hero: React.FC<HeroProps> = ({
  movie,
  onPlay,
  onMoreInfo,
  onToggleWatchlist,
  isWatchlisted,
  onOpenDownload,
}) => {
  return (
    <div className="relative w-full h-[75vh] min-h-[550px] max-h-[850px] flex items-end overflow-hidden bg-[var(--bg-main)]">
      {/* Backdrop Image & Scrim Gradients */}
      <div className="absolute inset-0 z-0">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center scale-105 animate-fade-in opacity-90"
          referrerPolicy="no-referrer"
        />
        {/* Cinematic Scrims: Nature-inspired forest green / dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/60 to-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent w-full lg:w-3/4"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full flex flex-col items-start gap-5">
        
        {/* Metadata Tags / Kicker */}
        <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-[var(--text-main)]">
          <span className="px-2.5 py-1 rounded bg-[var(--color-primary)] text-white font-bold text-xs uppercase tracking-wider shadow">
            Featured Grove
          </span>
          <span className="flex items-center gap-1 text-[var(--color-accent)] font-semibold">
            <Star className="w-4 h-4 fill-[var(--color-accent)]" /> {movie.rating}
          </span>
          <span aria-hidden="true">·</span>
          <span>{movie.releaseYear}</span>
          <span aria-hidden="true">·</span>
          <span>{movie.duration}</span>
          <span aria-hidden="true">·</span>
          <span className="border border-[var(--border-color)] px-1.5 py-0.5 rounded text-[11px]">{movie.contentRating}</span>
        </div>

        {/* Title */}
        <h1 className="font-serif font-bold text-4xl sm:text-6xl lg:text-7xl tracking-wider sm:tracking-widest text-white max-w-3xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] text-balance font-['Playfair_Display',serif]">
          {movie.title}
        </h1>

        {/* Genres unboxed with separators */}
        <div className="flex items-center gap-2 text-sm text-[var(--text-main)] font-medium">
          {movie.genres.map((genre, idx) => (
            <React.Fragment key={genre}>
              <span>{genre}</span>
              {idx < movie.genres.length - 1 && <span aria-hidden="true">·</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Synopsis */}
        <p className="text-sm sm:text-base text-white/95 max-w-2xl line-clamp-3 leading-relaxed font-normal tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] font-['Playfair_Display',serif] italic">
          "{movie.synopsis}"
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          {movie.availabilityLabel === 'PLAYABLE' || movie.availabilityLabel === 'EXTERNAL VIEWING' ? (
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(92,118,93,0.4)] transform hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-white" /> Watch Now
            </button>
          ) : (
            <span className="px-5 py-3.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-muted)] text-xs font-semibold border border-[var(--border-color)]">
              Trailer & Metadata Only
            </span>
          )}

          <button
            onClick={() => onMoreInfo(movie)}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm tracking-wide backdrop-blur-md border border-white/20 transition-all"
          >
            <Info className="w-4 h-4" /> More Info
          </button>

          <button
            onClick={() => onToggleWatchlist(movie.id)}
            className={`p-3.5 rounded-xl backdrop-blur-md border transition-all ${
              isWatchlisted
                ? 'bg-[var(--color-accent)] text-black border-[var(--color-accent)]'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Heart className={`w-5 h-5 ${isWatchlisted ? 'fill-black' : ''}`} />
          </button>

          <button
            onClick={() => onOpenDownload(movie)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm tracking-wide backdrop-blur-md border border-white/20 transition-all"
            title="Download via Telegram"
          >
            <Download className="w-4 h-4 text-[var(--color-accent)]" /> Telegram Download
          </button>
        </div>
      </div>
    </div>
  );
};
