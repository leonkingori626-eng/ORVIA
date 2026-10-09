import React, { useState, useEffect } from 'react';
import { Download, X, ExternalLink, ShieldCheck, AlertCircle, CheckCircle, Copy, ArrowRight } from 'lucide-react';
import { Movie } from '../types';

interface DownloadsModalProps {
  movieToDownload?: Movie | null;
  allMovies: Movie[];
  onClose: () => void;
}

export const DownloadsModal: React.FC<DownloadsModalProps> = ({
  movieToDownload,
  allMovies,
  onClose,
}) => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(movieToDownload || allMovies[0]);
  const [downloadState, setDownloadState] = useState<'idle' | 'redirecting' | 'fallback'>('idle');
  const [copied, setCopied] = useState(false);

  // Check URL parameters for ?download=telegram_post_id on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const downloadParam = params.get('download');
    if (downloadParam) {
      const found = allMovies.find((m) => m.telegramPostId === downloadParam || m.id === downloadParam);
      if (found) {
        setSelectedMovie(found);
      }
    }
  }, [allMovies]);

  const handleStartTelegramDownload = (movie: Movie) => {
    setDownloadState('redirecting');
    // Update URL parameter dynamically without reload
    const newUrl = `${window.location.pathname}?download=${movie.telegramPostId}`;
    window.history.replaceState({}, '', newUrl);

    setTimeout(() => {
      // Open Telegram post link in new tab or fallback
      const opened = window.open(movie.telegramUrl, '_blank', 'noopener,noreferrer');
      if (!opened) {
        setDownloadState('fallback');
      } else {
        setDownloadState('idle');
      }
    }, 1200);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0b0c10] border border-white/15 rounded-2xl overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.9)] p-6 sm:p-8 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-white text-xl">Telegram Direct Download Center</h2>
              <p className="text-xs text-white/50">Dynamic Telegram Post ID Resolution & Fallback Links</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/60 font-medium">Select Title for Download</label>
          <select
            value={selectedMovie?.id}
            onChange={(e) => {
              const m = allMovies.find((item) => item.id === e.target.value);
              if (m) setSelectedMovie(m);
            }}
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#d4af37]"
          >
            {allMovies.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#0b0c10] text-white">
                {m.title} ({m.releaseYear}) — Post ID: {m.telegramPostId}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Movie Details & Telegram Post Card */}
        {selectedMovie && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <img
                src={selectedMovie.posterUrl}
                alt={selectedMovie.title}
                className="w-20 h-28 rounded-lg object-cover bg-slate-900 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col gap-1.5 overflow-hidden">
                <h3 className="font-serif font-bold text-white text-lg">{selectedMovie.title}</h3>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span>Release: {selectedMovie.releaseYear}</span>
                  <span aria-hidden="true">·</span>
                  <span>Duration: {selectedMovie.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#d4af37] bg-black/40 px-2 py-1 rounded w-fit border border-white/10 mt-1">
                  <span>Telegram Post ID: {selectedMovie.telegramPostId}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Destination URL:</span>
                <span className="font-mono text-[#d4af37] truncate max-w-[280px] sm:max-w-[360px]">
                  {selectedMovie.telegramUrl}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleStartTelegramDownload(selectedMovie)}
                  disabled={downloadState === 'redirecting'}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50"
                >
                  {downloadState === 'redirecting' ? (
                    'Resolving Telegram Stream...'
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" /> Open in Telegram
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleCopyLink(selectedMovie.telegramUrl)}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>

              {/* Error handling & Fallback */}
              {downloadState === 'fallback' && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>Popup blocked or Telegram unreachable. Please use the copied link directly in your browser.</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-[11px] text-white/40 text-center">
          ORVIA complies with authorized distribution guidelines and respects external provider embedding policies.
        </div>
      </div>
    </div>
  );
};
