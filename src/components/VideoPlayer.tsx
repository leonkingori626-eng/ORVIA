import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, ShieldAlert, CheckCircle2, Download, Layers } from 'lucide-react';
import { Movie, PlaybackResolutionResult, PlaybackStreamSource } from '../types';
import { resolvePlaybackSource, resolvePlaybackSourceBackendAsync } from '../services/contentRegistry';

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

  const isTestMode = movie.id === 'player-test-sample' || (movie as any).isTestSample === true;
  const initialLocalResolution = resolvePlaybackSource(movie.id);
  const initialSourceRecord = initialLocalResolution.sourceRecord;

  // Initial authorization determination
  const initialPlayable = isTestMode || (
    movie.availabilityLabel === 'PLAYABLE' && (
      Boolean(movie.playbackUrl) || (initialSourceRecord?.availabilityStatus === 'verified' && Boolean(initialSourceRecord.verifiedMediaUrl))
    )
  );

  const getInitialMirrors = (id: string, initialUrl?: string): string[] => {
    if (!initialPlayable) return [];
    const mirrors: string[] = [];
    if (initialUrl && initialUrl.trim()) mirrors.push(initialUrl.trim());
    if (id === 'night-of-the-living-dead') {
      mirrors.push(
        '/api/media/stream/night-of-the-living-dead',
        'https://dn711006.ca.archive.org/0/items/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4',
        'https://archive.org/download/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4'
      );
    } else if (id === 'elephants-dream') {
      mirrors.push(
        '/api/media/stream/elephants-dream',
        'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4'
      );
    } else if (id === 'cosmos-laundromat' || id === 'cosmos-laundromat-s1e1') {
      mirrors.push(
        '/api/media/stream/cosmos-laundromat-s1e1',
        'https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4'
      );
    } else if (id === 'player-test-sample') {
      mirrors.push(
        '/api/media/stream/player-test-sample',
        'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4'
      );
    }
    return Array.from(new Set(mirrors.filter(Boolean)));
  };

  const [isAuthorizedPlayable, setIsAuthorizedPlayable] = useState<boolean>(initialPlayable);
  const [resolutionResult, setResolutionResult] = useState<PlaybackResolutionResult | null>(null);
  const [verifiedMirrors, setVerifiedMirrors] = useState<string[]>(() => {
    return getInitialMirrors(movie.id, movie.playbackUrl || initialSourceRecord?.verifiedMediaUrl);
  });

  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [currentPlaybackUrl, setCurrentPlaybackUrl] = useState<string>(() => {
    const list = getInitialMirrors(movie.id, movie.playbackUrl || initialSourceRecord?.verifiedMediaUrl);
    return list[0] || '';
  });

  const [isPlaying, setIsPlaying] = useState(initialPlayable);
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(!initialPlayable);
  const [errorMessage, setErrorMessage] = useState(
    !initialPlayable
      ? 'No verified playback source is currently available for this title. Direct full-length streaming is not authorized.'
      : ''
  );
  const [isLoading, setIsLoading] = useState(initialPlayable);

  // Authoritative Backend Resolution Hook
  useEffect(() => {
    let isSubscribed = true;
    const fetchBackendResolution = async () => {
      try {
        const res = await resolvePlaybackSourceBackendAsync(movie.id, undefined, isTestMode);
        if (!isSubscribed) return;
        setResolutionResult(res);

        if (res.authorized && res.sources && res.sources.length > 0) {
          const mirrors = res.sources.map((s: PlaybackStreamSource) => s.proxyUrl || s.streamUrl).filter(Boolean);
          setVerifiedMirrors(mirrors);
          setCurrentPlaybackUrl(mirrors[0] || '');
          setIsAuthorizedPlayable(true);
          setHasError(false);
          setIsLoading(true);
          setErrorMessage('');
        } else {
          setIsAuthorizedPlayable(false);
          setHasError(true);
          setErrorMessage(res.reason || 'No verified playback source is authorized for this title.');
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        console.warn('[ORVIA Player] Backend resolution warning, falling back to local registry:', err.message);
      }
    };

    fetchBackendResolution();
    return () => {
      isSubscribed = false;
    };
  }, [movie.id, isTestMode]);

  // Structured Diagnostics Logging on Player Mount
  useEffect(() => {
    console.log(JSON.stringify({
      event: 'player_initialized',
      movieId: movie.id,
      title: movie.title,
      isAuthorizedPlayable,
      isTestMode,
      sourceProvider: initialSourceRecord?.providerName || (isTestMode ? 'Diagnostic Test Engine' : 'Unverified'),
      initialUrl: currentPlaybackUrl || 'none',
      mirrorsCount: verifiedMirrors.length,
      timestamp: new Date().toISOString()
    }));
  }, [movie.id]);

  // Diagnostic Check: Probe HTTP status, MIME type, and 206 Partial Content byte-range support
  useEffect(() => {
    if (!currentPlaybackUrl || !isAuthorizedPlayable) return;

    let isSubscribed = true;
    const probeStream = async () => {
      try {
        const probeRes = await fetch(currentPlaybackUrl, {
          method: 'GET',
          headers: { Range: 'bytes=0-1' },
        });

        if (!isSubscribed) return;

        const statusCode = probeRes.status;
        const mimeType = probeRes.headers.get('content-type') || 'unknown';
        const contentRange = probeRes.headers.get('content-range') || 'none';
        const acceptRanges = probeRes.headers.get('accept-ranges') || 'none';
        const has206PartialContent = statusCode === 206;
        const supportsByteRanges = has206PartialContent || contentRange.startsWith('bytes') || acceptRanges.includes('bytes');

        console.log(JSON.stringify({
          event: 'stream_header_diagnostic',
          movieId: movie.id,
          title: movie.title,
          streamUrl: currentPlaybackUrl,
          httpStatusCode: statusCode,
          mimeType,
          contentRange,
          acceptRanges,
          is206PartialContent: has206PartialContent,
          supportsByteRanges,
          timestamp: new Date().toISOString()
        }));

        if (!has206PartialContent && statusCode !== 200) {
          console.warn(`[ORVIA Diagnostic] Non-206 stream response received: HTTP ${statusCode} for ${currentPlaybackUrl}`);
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        console.warn(JSON.stringify({
          event: 'stream_diagnostic_network_probe_failed',
          movieId: movie.id,
          streamUrl: currentPlaybackUrl,
          error: err.message,
          timestamp: new Date().toISOString()
        }));
      }
    };

    probeStream();

    return () => {
      isSubscribed = false;
    };
  }, [currentPlaybackUrl, movie.id, isAuthorizedPlayable]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const mediaError = videoRef.current?.error;
    const errorCode = mediaError?.code; // 1: ABORTED, 2: NETWORK, 3: DECODE, 4: SRC_NOT_SUPPORTED
    const errorDetail = mediaError?.message || 'HTML video element error event fired';
    const nextIdx = fallbackIndex + 1;

    console.warn(JSON.stringify({
      event: 'player_stream_error',
      movieId: movie.id,
      title: movie.title,
      failedUrl: currentPlaybackUrl,
      mediaErrorCode: errorCode,
      mediaErrorMessage: errorDetail,
      attemptIndex: fallbackIndex,
      nextMirrorAvailable: nextIdx < verifiedMirrors.length,
      timestamp: new Date().toISOString()
    }));

    // Only retry if a valid alternative mirror exists for the EXACT same title
    if (nextIdx < verifiedMirrors.length) {
      console.log(`[ORVIA Player] Trying backup mirror [${nextIdx}/${verifiedMirrors.length}] for "${movie.title}": ${verifiedMirrors[nextIdx]}`);
      setFallbackIndex(nextIdx);
      setCurrentPlaybackUrl(verifiedMirrors[nextIdx]);
      setIsLoading(true);
      setHasError(false);
    } else {
      console.error(`[ORVIA Player] All verified mirrors exhausted for "${movie.title}".`);
      setHasError(true);
      setErrorMessage(
        errorCode === 4
          ? 'Media format or codec not supported by browser / stream mirror unavailable.'
          : errorCode === 2
          ? 'Network failure during media retrieval.'
          : 'The authorized stream provider could not be reached.'
      );
      setIsLoading(false);
    }
  };

  let controlsTimeout: NodeJS.Timeout;

  useEffect(() => {
    if (videoRef.current && currentPlaybackUrl) {
      videoRef.current.currentTime = initialProgress;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name === 'NotAllowedError') {
            console.warn('[ORVIA Player] Browser autoplay policy muted audio initially:', err.message);
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().catch(() => {
                setIsPlaying(false);
              });
            }
          } else if (err.name === 'AbortError') {
            // Scrubbing or normal transition, ignore safely
          } else {
            console.warn('[ORVIA Player] Playback promise handled rejection:', err.name, err.message);
          }
        });
      }
    }
  }, [currentPlaybackUrl, initialProgress]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(duration || 10000, videoRef.current.currentTime + 10);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

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
        videoRef.current.play().catch((err) => console.warn('[ORVIA Player] togglePlay rejected:', err.message));
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
      {/* HTML Video Element - Only rendered when an authorized stream URL is present */}
      {isAuthorizedPlayable && currentPlaybackUrl && (
        <video
          ref={videoRef}
          key={currentPlaybackUrl}
          src={currentPlaybackUrl}
          className="w-full h-full object-contain cursor-pointer"
          autoPlay
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            setDuration(videoRef.current?.duration || 0);
            setIsLoading(false);
            setHasError(false);
            console.log(JSON.stringify({
              event: 'player_metadata_loaded',
              movieId: movie.id,
              duration: videoRef.current?.duration,
              videoWidth: videoRef.current?.videoWidth,
              videoHeight: videoRef.current?.videoHeight
            }));
          }}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={handleVideoError}
          onClick={togglePlay}
        />
      )}

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="w-12 h-12 rounded-full border-4 border-[#d4af37] border-t-transparent animate-spin mb-4"></div>
          <span className="text-white font-serif tracking-widest text-sm">
            {isTestMode ? 'INITIALIZING BENCHMARK STREAM...' : 'CONNECTING VERIFIED STREAM...'}
          </span>
        </div>
      )}

      {/* Error / Unauthorized State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center max-w-2xl mx-auto my-auto z-20">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6">
            {!isAuthorizedPlayable ? (
              <ShieldAlert className="w-14 h-14 mx-auto" />
            ) : (
              <AlertCircle className="w-14 h-14 mx-auto" />
            )}
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
            {!isAuthorizedPlayable ? 'No Verified Playback Source Available' : 'Playback Stream Unavailable'}
          </h2>

          <p className="text-white/70 max-w-lg mb-4 text-sm leading-relaxed">
            {!isAuthorizedPlayable ? (
              <>
                Direct full-length video playback is not currently authorized or licensed for <strong>&ldquo;{movie.title}&rdquo;</strong>. In accordance with ORVIA content rights compliance, catalog items without verified public domain or open licenses provide official trailers and metadata only.
              </>
            ) : (
              <>
                The verified video stream for <strong>&ldquo;{movie.title}&rdquo;</strong> could not be connected from upstream mirrors.
              </>
            )}
          </p>

          {errorMessage && (
            <div className="text-xs text-amber-300 font-mono mb-6 bg-white/5 px-4 py-2 rounded-xl border border-white/10 max-w-md">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {isAuthorizedPlayable && verifiedMirrors.length > 0 && (
              <button
                onClick={() => {
                  setFallbackIndex(0);
                  setCurrentPlaybackUrl(verifiedMirrors[0]);
                  setHasError(false);
                  setIsLoading(true);
                }}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-colors"
              >
                Retry Primary Mirror
              </button>
            )}

            {movie.telegramUrl && (
              <a
                href={movie.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold text-sm border border-sky-500/30 transition-colors"
              >
                <Download className="w-4 h-4" /> Telegram Archive
              </a>
            )}

            <button
              onClick={onClose}
              className="px-7 py-2.5 rounded-xl bg-[#d4af37] text-black font-bold text-sm hover:bg-amber-400 transition-colors shadow-lg"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      )}

      {/* Top Bar Controls */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-10 ${
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
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-serif font-bold text-white text-lg">{movie.title}</h2>
              {isTestMode ? (
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Test Mode Benchmark
                </span>
              ) : isAuthorizedPlayable ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Verified Stream
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Metadata Only
                </span>
              )}
            </div>
            <p className="text-xs text-white/50">{movie.releaseYear} · {movie.genres.join(', ')} · {movie.contentRating}</p>
          </div>
        </div>
      </div>

      {/* Bottom Bar Controls - Only shown when media is playable */}
      {isAuthorizedPlayable && !hasError && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-4 transition-opacity duration-300 z-10 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-white/70 w-12 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
            />
            <span className="text-xs font-mono text-white/70 w-12">{formatTime(duration)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="p-3 rounded-full bg-[#d4af37] text-black hover:bg-amber-400 transition-colors shadow-lg"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black" />}
              </button>

              <div className="flex items-center gap-2 group/vol">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
