import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw, Subtitles, AlertCircle } from 'lucide-react';
import { Movie } from '../types';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
  onUpdateProgress: (movieId: string, progress: number, total: number) => void;
  initialProgress?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  movie,
  onClose,
  onUpdateProgress,
  initialProgress = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  let controlsTimeout: NodeJS.Timeout;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = initialProgress;
    }
  }, [initialProgress]);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(controlsTimeout);
      controlsTimeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(controlsTimeout);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      setCurrentTime(cur);
      setDuration(dur);
      onUpdateProgress(movie.id, cur, dur);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}:${remainMins < 10 ? '0' : ''}${remainMins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
    }
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none animate-fade-in"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={movie.playbackUrl}
        className="w-full h-full object-contain cursor-pointer"
        autoPlay
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          setDuration(videoRef.current?.duration || 0);
          setIsLoading(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        onClick={togglePlay}
        crossOrigin="anonymous"
      />

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="w-12 h-12 rounded-full border-4 border-[#d4af37] border-t-transparent animate-spin mb-4"></div>
          <span className="text-white font-serif tracking-widest text-sm">LOADING ORVIA STREAM...</span>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
          <h2 className="font-serif text-2xl font-bold text-white mb-2">Playback Stream Unavailable</h2>
          <p className="text-white/60 max-w-md mb-6 text-sm">
            The authorized video stream for "{movie.title}" could not be loaded. You can still download the media file directly via Telegram.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#d4af37] text-black font-bold text-sm hover:bg-amber-400 transition-colors"
          >
            Return to ORVIA
          </button>
        </div>
      )}

      {/* Simulated Subtitles overlay */}
      {subtitlesEnabled && !hasError && currentTime > 3 && currentTime < 12 && (
        <div className="absolute bottom-24 left-0 right-0 text-center pointer-events-none">
          <span className="bg-black/70 text-white px-4 py-1.5 rounded-md font-medium text-lg sm:text-xl shadow-lg border border-white/10 font-serif">
            "The universe unfolds in rhythms beyond our immediate grasp."
          </span>
        </div>
      )}

      {/* Top Bar Controls */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all"
            title="Close Player"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-serif font-bold text-white text-lg">{movie.title}</h2>
            <p className="text-xs text-[#d4af37]">ORVIA Authorized Cinematic Stream</p>
          </div>
        </div>
      </div>

      {/* Bottom Bar Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-xs font-mono text-white/80 w-12 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
          />
          <span className="text-xs font-mono text-white/80 w-12">{formatTime(duration)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-[#d4af37] text-black hover:bg-amber-400 transition-colors shadow-lg"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black" />}
            </button>

            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime -= 10;
              }}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              title="Rewind 10s"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime += 10;
              }}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              title="Forward 10s"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="p-2 text-white hover:text-[#d4af37] transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#d4af37] hidden sm:block"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                subtitlesEnabled ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/10 text-white border-white/20'
              }`}
            >
              <Subtitles className="w-4 h-4" />
              <span>CC {subtitlesEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-full hover:bg-white/10 text-white transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
