import React, { useState, useEffect } from 'react';
import { X, Play, Heart, Download, Star, Clock, Calendar, ShieldCheck, Film, Share2, AlertCircle, Loader2 } from 'lucide-react';
import { Movie, Episode } from '../types';
import { fetchTitleDetailsAsync } from '../services/contentRegistry';

interface MovieDetailsModalProps {
  movie: Movie | null;
  onClose: () => void;
  onPlay: (movie: Movie, overrideUrl?: string, episode?: Episode, isTrailer?: boolean) => void;
  onToggleWatchlist: (movieId: string) => void;
  isWatchlisted: boolean;
  onOpenDownload: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
  allMovies: Movie[];
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  onClose,
  onPlay,
  onToggleWatchlist,
  isWatchlisted,
  onOpenDownload,
  onSelectMovie,
  allMovies,
}) => {
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);
  const [enrichedMovie, setEnrichedMovie] = useState<Movie | null>(movie);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (!movie) return;
    setEnrichedMovie(movie);
    setSelectedSeasonIdx(0);

    // If cast is empty or if seriesData is missing for TV, asynchronously load rich details from provider adapter
    const needsEnrichment = (!movie.cast || movie.cast.length === 0) || (movie.category === 'tv' && (!movie.seriesData || movie.seriesData.seasons.length === 0));

    if (needsEnrichment) {
      let isSubscribed = true;
      setIsLoadingDetails(true);
      fetchTitleDetailsAsync(movie.id)
        .then((fullDetails) => {
          if (!isSubscribed) return;
          if (fullDetails) {
            setEnrichedMovie((prev) => ({
              ...(prev || movie),
              ...fullDetails,
              posterUrl: fullDetails.posterUrl || prev?.posterUrl || movie.posterUrl,
              backdropUrl: fullDetails.backdropUrl || prev?.backdropUrl || movie.backdropUrl,
            }));
          }
        })
        .catch((err) => console.warn('[MovieDetailsModal] Error fetching rich details:', err.message))
        .finally(() => {
          if (isSubscribed) setIsLoadingDetails(false);
        });

      return () => {
        isSubscribed = false;
      };
    }
  }, [movie?.id]);

  if (!movie) return null;
  const currentMovie = enrichedMovie || movie;

  const relatedMovies = allMovies.filter(
    (m) => m.id !== currentMovie.id && m.genres.some((g) => currentMovie.genres.includes(g))
  ).slice(0, 4);

  const handleTelegramShare = () => {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`Watch "${currentMovie.title}" (${currentMovie.releaseYear}) on ORVIA - A Universe of Stories:`);
    const telegramShareUrl = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;
    window.open(telegramShareUrl, '_blank', 'noopener,noreferrer');
  };

  const isSeries = currentMovie.category === 'tv';
  const seasons = currentMovie.seriesData?.seasons || [];
  const currentSeason = seasons[selectedSeasonIdx] || seasons[0];
  const allEpisodes = seasons.flatMap((s) => s.episodes || []);
  const firstPlayableEpisode = allEpisodes.find((ep) => ep.isPlayable !== false && Boolean(ep.playbackUrl));

  // Genuine playback availability verification
  const hasFullMovieSource = !isSeries && (
    currentMovie.hasFullMovie === true ||
    (currentMovie.availabilityLabel === 'PLAYABLE' && Boolean(currentMovie.playbackUrl))
  );

  const hasFullEpisodeSource = isSeries && Boolean(firstPlayableEpisode);
  const hasTrailerSource = Boolean(currentMovie.hasTrailer || currentMovie.trailerUrl);

  const getHeaderBadge = () => {
    if (isSeries) {
      return { text: 'TV Series', className: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    }
    if (hasFullMovieSource) {
      return { text: 'Feature Film', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
    if (currentMovie.isClassic) {
      return { text: 'Classic Cinema', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    if (currentMovie.availabilityLabel === 'EXTERNAL VIEWING') {
      return { text: 'External Viewing', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    }
    return { text: 'Catalog Archive', className: 'bg-white/10 text-white/70 border-white/20' };
  };

  const headerBadge = getHeaderBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[#0b0c10] border border-white/15 rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] my-auto max-h-[90vh] flex flex-col">
        
        {/* Header Hero Section */}
        <div className="relative w-full h-[320px] sm:h-[420px] shrink-0">
          <img
            src={currentMovie.backdropUrl}
            alt={currentMovie.title}
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/60 to-black/40"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/25 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Overlay info */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-medium text-white/90">
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${headerBadge.className}`}>
                {headerBadge.text}
              </span>
              <span className="flex items-center gap-1 text-[#d4af37] font-bold">
                <Star className="w-4 h-4 fill-[#d4af37]" /> {currentMovie.rating}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-white/60" /> {currentMovie.releaseYear}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-white/60" /> {currentMovie.duration}</span>
              <span aria-hidden="true">·</span>
              <span className="border border-white/30 px-1.5 py-0.5 rounded text-[11px]">{currentMovie.contentRating}</span>
              {isLoadingDetails && (
                <span className="flex items-center gap-1 text-xs text-amber-300">
                  <Loader2 className="w-3 h-3 animate-spin" /> Updating credits &amp; seasons...
                </span>
              )}
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight">
              {currentMovie.title}
            </h2>

            {/* Separate playback actions: Watch Movie / Watch Episode / Watch Trailer */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* 1. Watch Movie - only for verified full movie */}
              {hasFullMovieSource && (
                <button
                  onClick={() => {
                    onPlay(currentMovie, currentMovie.playbackUrl, undefined, false);
                    onClose();
                  }}
                  className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" /> Watch Movie
                </button>
              )}

              {/* 2. Watch Episode - only for verified episode in series */}
              {hasFullEpisodeSource && (
                <button
                  onClick={() => {
                    onPlay(currentMovie, firstPlayableEpisode!.playbackUrl, firstPlayableEpisode, false);
                    onClose();
                  }}
                  className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" /> Watch Episode {firstPlayableEpisode!.episodeNumber}
                </button>
              )}

              {/* 3. Watch Trailer - only for verified trailer source */}
              {hasTrailerSource && (
                <button
                  onClick={() => {
                    onPlay(
                      {
                        ...currentMovie,
                        isTrailerPlayback: true,
                        playbackUrl: currentMovie.trailerUrl || '',
                        title: `${currentMovie.title} (Official Trailer)`,
                      },
                      currentMovie.trailerUrl,
                      undefined,
                      true
                    );
                    onClose();
                  }}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm tracking-wide backdrop-blur-md border border-white/25 hover:border-amber-400/50 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Film className="w-4 h-4 text-amber-400" /> Watch Trailer
                </button>
              )}

              {/* If neither full media nor trailer source exists */}
              {!hasFullMovieSource && !hasFullEpisodeSource && !hasTrailerSource && (
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 text-white/70 text-xs font-medium border border-white/10">
                  <AlertCircle className="w-4 h-4 text-amber-400/80 shrink-0" />
                  <span>Stream &amp; Trailer Not Currently Licensed</span>
                </div>
              )}

              <button
                onClick={() => onToggleWatchlist(currentMovie.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl backdrop-blur-md border text-sm font-semibold transition-all ${
                  isWatchlisted
                    ? 'bg-[#d4af37] text-black border-[#d4af37]'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWatchlisted ? 'fill-black' : ''}`} />
                {isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
              </button>

              <button
                onClick={() => onOpenDownload(currentMovie)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/20 transition-all"
              >
                <Download className="w-4 h-4 text-[#d4af37]" /> Telegram Download
              </button>

              <button
                onClick={handleTelegramShare}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/20 transition-all"
                title="Share via Telegram"
              >
                <Share2 className="w-4 h-4 text-[#d4af37]" /> Share
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Details */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
          
          {/* Genres & Synopsis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 text-sm text-[#d4af37]">
                {(currentMovie.genres || []).map((g, idx) => (
                  <React.Fragment key={g}>
                    <span>{g}</span>
                    {idx < currentMovie.genres.length - 1 && <span aria-hidden="true">·</span>}
                  </React.Fragment>
                ))}
              </div>

              <p className="text-white/80 text-base leading-relaxed">
                {currentMovie.synopsis}
              </p>

              <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/50 block text-xs">Director</span>
                  <span className="text-white font-medium">{currentMovie.director}</span>
                </div>
                <div>
                  <span className="text-white/50 block text-xs">Writers</span>
                  <span className="text-white font-medium">{(currentMovie.writers || []).join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Poster & Source attribution card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
              <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-slate-900">
                <img
                  src={currentMovie.posterUrl}
                  alt={currentMovie.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Status: {currentMovie.availabilityLabel}</span>
              </div>
            </div>
          </div>

          {/* Series / Episodes Section if available */}
          {currentMovie.seriesData && currentMovie.seriesData.seasons.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-white">Episodes &amp; Seasons</h3>
                <span className="text-xs text-white/50 font-mono">
                  {currentMovie.seriesData.seasons.length} Season{currentMovie.seriesData.seasons.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center gap-2 pb-2 overflow-x-auto">
                {currentMovie.seriesData.seasons.map((season, sIdx) => (
                  <button
                    key={season.seasonNumber}
                    onClick={() => setSelectedSeasonIdx(sIdx)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedSeasonIdx === sIdx
                        ? 'bg-[#d4af37] text-black shadow-lg'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {season.title}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {(currentMovie.seriesData.seasons[selectedSeasonIdx]?.episodes || []).map((ep: Episode) => {
                  const isEpPlayable = ep.availabilityLabel === 'PLAYABLE' && Boolean(ep.playbackUrl);
                  return (
                    <div
                      key={ep.episodeNumber}
                      onClick={() => {
                        if (isEpPlayable) {
                          onPlay(currentMovie, ep.playbackUrl, ep);
                          onClose();
                        }
                      }}
                      className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                        isEpPlayable
                          ? 'bg-white/5 border-white/10 hover:border-[#d4af37]/50 cursor-pointer group'
                          : 'bg-white/[0.02] border-white/5 opacity-75 cursor-default'
                      }`}
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
                          isEpPlayable ? 'bg-white/10 group-hover:bg-[#d4af37] group-hover:text-black transition-colors' : 'bg-white/5 text-white/40'
                        }`}>
                          {ep.episodeNumber}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-serif font-bold text-sm truncate ${
                              isEpPlayable ? 'text-white group-hover:text-[#d4af37]' : 'text-white/70'
                            }`}>
                              {ep.title}
                            </h4>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              isEpPlayable
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-white/10 text-white/50 border border-white/10'
                            }`}>
                              {isEpPlayable ? 'Available' : 'Unreleased'}
                            </span>
                          </div>
                          <p className="text-xs text-white/50 line-clamp-1 mt-0.5">{ep.synopsis}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-white/50 font-mono">{ep.duration}</span>
                        {isEpPlayable ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlay(currentMovie, ep.playbackUrl, ep, false);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d4af37] text-black text-xs font-bold shadow-md hover:bg-amber-400 transition-all"
                            title="Watch verified episode"
                          >
                            <Play className="w-3.5 h-3.5 fill-black" /> Watch Episode
                          </button>
                        ) : (
                          <div className="px-2.5 py-1 rounded bg-white/5 text-white/40 text-[10px] font-semibold border border-white/5">
                            Not Released
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cast Carousel */}
          {currentMovie.cast && currentMovie.cast.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-white">Cast &amp; Crew</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {currentMovie.cast.map((actor, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <img
                      src={actor.avatarUrl}
                      alt={actor.name}
                      className="w-12 h-12 rounded-full object-cover border border-white/20"
                      referrerPolicy="no-referrer"
                    />
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-white text-sm truncate">{actor.name}</h4>
                      <p className="text-xs text-white/50 truncate">{actor.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Titles */}
          {relatedMovies.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-white">More Like This</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {relatedMovies.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectMovie(rel)}
                    className="group cursor-pointer rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-[#d4af37]/50 transition-all"
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900">
                      <img
                        src={rel.backdropUrl}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-white text-sm truncate">{rel.title}</h4>
                      <p className="text-xs text-white/50 mt-0.5">{rel.releaseYear} · {rel.rating} ★</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
