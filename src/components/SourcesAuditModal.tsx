import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, Globe, 
  DollarSign, FileText, Play, PlusCircle, Check, Power, Layers, Database
} from 'lucide-react';
import { PlaybackSourceRecord, Movie, PlaybackStreamSource, VideoQuality, MediaFormat, DistributionRights } from '../types';
import { verifyAllContentSources } from '../services/contentRegistry';
import { PLAYER_TEST_SAMPLE } from '../data/movies';

interface SourcesAuditModalProps {
  movies: Movie[];
  onClose: () => void;
  onPlayTestSample?: (movie: Movie) => void;
}

export const SourcesAuditModal: React.FC<SourcesAuditModalProps> = ({ movies, onClose, onPlayTestSample }) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'register' | 'audit'>('sources');
  const [sources, setSources] = useState<PlaybackStreamSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [verifyingSourceId, setVerifyingSourceId] = useState<string | null>(null);
  const [probeResults, setProbeResults] = useState<Record<string, { status: number; byteRange: boolean }>>({});
  
  // Registration Form State
  const [regContentId, setRegContentId] = useState('night-of-the-living-dead');
  const [customContentId, setCustomContentId] = useState('');
  const [regTitle, setRegTitle] = useState('');
  const [regQuality, setRegQuality] = useState<VideoQuality>('1080p');
  const [regFormat, setRegFormat] = useState<MediaFormat>('mp4');
  const [regStreamUrl, setRegStreamUrl] = useState('');
  const [regCdnProvider, setRegCdnProvider] = useState('Internet Archive Global Edge');
  const [regRights, setRegRights] = useState<DistributionRights>('public-domain');
  const [regLicenseTerms, setRegLicenseTerms] = useState('Public Domain in the United States');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Fetch real backend stream sources from /api/admin/registry
  const loadAdminRegistry = async () => {
    setIsLoadingSources(true);
    try {
      const res = await fetch('/api/admin/registry');
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (err: any) {
      console.warn('Could not fetch admin registry from backend:', err.message);
    } finally {
      setIsLoadingSources(false);
    }
  };

  useEffect(() => {
    loadAdminRegistry();
  }, []);

  // Live single-source verification probe
  const handleVerifySource = async (sourceId: string) => {
    setVerifyingSourceId(sourceId);
    try {
      const res = await fetch(`/api/admin/sources/${encodeURIComponent(sourceId)}/verify`, {
        method: 'POST',
      });
      const data = await res.json();
      setProbeResults((prev) => ({
        ...prev,
        [sourceId]: {
          status: data.httpStatus || 200,
          byteRange: Boolean(data.byteRangeSupported),
        },
      }));
      // Refresh registry
      loadAdminRegistry();
    } catch (err: any) {
      console.warn('Probe error for source:', err.message);
    } finally {
      setVerifyingSourceId(null);
    }
  };

  // Toggle active/inactive flag for a source (e.g. rights expired)
  const handleToggleSource = async (sourceId: string) => {
    try {
      const res = await fetch(`/api/admin/sources/${encodeURIComponent(sourceId)}/toggle`, {
        method: 'POST',
      });
      if (res.ok) {
        loadAdminRegistry();
      }
    } catch (err: any) {
      console.warn('Toggle error:', err.message);
    }
  };

  // Register new permitted playback source
  const handleRegisterSource = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveContentId = regContentId === 'custom' ? customContentId.trim() : regContentId;
    if (!effectiveContentId || !regStreamUrl || !regTitle) return;

    setIsSubmitting(true);
    setSubmitSuccess(null);
    try {
      const res = await fetch('/api/admin/sources/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: effectiveContentId,
          title: regTitle,
          quality: regQuality,
          format: regFormat,
          streamUrl: regStreamUrl,
          cdnProvider: regCdnProvider,
          rightsStatus: regRights,
          licenseTerms: regLicenseTerms,
          attribution: `Authorized by ORVIA Content Operations (${regRights})`,
        }),
      });

      if (res.ok) {
        setSubmitSuccess(`Playback source successfully registered for ${effectiveContentId}!`);
        setRegTitle('');
        setRegStreamUrl('');
        setCustomContentId('');
        loadAdminRegistry();
        setTimeout(() => setSubmitSuccess(null), 4000);
      }
    } catch (err: any) {
      console.warn('Registration failed:', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0b0c10] border border-white/15 rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-6 sm:p-8 flex flex-col gap-6 my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-white text-xl">ORVIA Content Registry & Source Manager</h2>
              <p className="text-xs text-white/50">Authoritative playback resolution, rights validation, and live CDN probe management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sources'
                ? 'bg-[#d4af37] text-black shadow-lg'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            Verified Sources & Probes ({sources.length})
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'register'
                ? 'bg-[#d4af37] text-black shadow-lg'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Register Permitted Source
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-[#d4af37] text-black shadow-lg'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            Catalog Rights & Economics
          </button>
        </div>

        {/* Tab 1: Verified Sources & Live Probes */}
        {activeTab === 'sources' && (
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[55vh] pr-1">
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
              <div className="flex items-center gap-3 text-white/70">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> {sources.filter((s) => s.isActive).length} Active Sources
                </span>
                <span aria-hidden="true">·</span>
                <span>{sources.filter((s) => !s.isActive).length} Disabled / Expired</span>
              </div>
              <div className="flex items-center gap-2">
                {onPlayTestSample && (
                  <button
                    onClick={() => onPlayTestSample(PLAYER_TEST_SAMPLE)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs border border-blue-500/30 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-blue-300" />
                    Player Benchmark Test Mode
                  </button>
                )}
                <button
                  onClick={loadAdminRegistry}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>

            {sources.map((source) => {
              const probe = probeResults[source.sourceId];
              const isProbing = verifyingSourceId === source.sourceId;

              return (
                <div
                  key={source.sourceId}
                  className={`p-4 rounded-xl border transition-all ${
                    source.isActive
                      ? 'bg-white/5 border-white/10 hover:border-[#d4af37]/40'
                      : 'bg-rose-950/20 border-rose-900/30 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-white/80">
                          {source.contentId}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          {source.quality}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">
                          {source.format}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          source.rightsStatus === 'public-domain' ? 'bg-amber-500/20 text-amber-300' :
                          source.rightsStatus === 'creative-commons' ? 'bg-indigo-500/20 text-indigo-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {source.rightsStatus}
                        </span>
                        {!source.isActive && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 uppercase">
                            Disabled / Revoked
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif font-bold text-white text-sm">{source.title}</h4>
                      <p className="text-xs text-white/50 truncate max-w-lg mt-0.5 font-mono">{source.streamUrl}</p>
                      <div className="text-[11px] text-white/40 mt-1">
                        CDN: <strong className="text-white/60">{source.cdnProvider}</strong> · Terms: {source.licenseTerms}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleVerifySource(source.sourceId)}
                        disabled={isProbing}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors disabled:opacity-50"
                        title="Live probe byte-range headers and HTTP status"
                      >
                        <RefreshCw className={`w-3 h-3 ${isProbing ? 'animate-spin' : ''}`} />
                        {isProbing ? 'Probing...' : 'Live Probe'}
                      </button>

                      <button
                        onClick={() => handleToggleSource(source.sourceId)}
                        className={`p-2 rounded-lg text-xs font-bold transition-colors ${
                          source.isActive
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        }`}
                        title={source.isActive ? 'Disable source (Revoke / Expire)' : 'Enable source'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {probe && (
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-3 text-xs font-mono">
                      <span className={probe.status === 206 || probe.status === 200 ? 'text-emerald-400' : 'text-rose-400'}>
                        Live Status: HTTP {probe.status}
                      </span>
                      <span>·</span>
                      <span className={probe.byteRange ? 'text-emerald-400' : 'text-amber-400'}>
                        HTTP 206 Byte-Range: {probe.byteRange ? 'Supported (Seek Enabled)' : 'Full Download Only'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Register Permitted Source Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSource} className="space-y-4 overflow-y-auto max-h-[55vh] pr-1">
            <div className="bg-amber-950/20 border border-amber-800/30 p-3 rounded-xl text-xs text-amber-200">
              Register an authorized public domain, Creative Commons, or licensed streaming endpoint for an existing movie or TV episode. ORVIA strictly rejects unauthorized streams, unverified mirrors, or random cross-title fallbacks.
            </div>

            {submitSuccess && (
              <div className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                {submitSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Target Content ID</label>
                <select
                  value={regContentId}
                  onChange={(e) => setRegContentId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#d4af37]"
                >
                  <option value="night-of-the-living-dead">night-of-the-living-dead (Movie)</option>
                  <option value="elephants-dream">elephants-dream (Movie)</option>
                  <option value="cosmos-laundromat-s1e1">cosmos-laundromat-s1e1 (Series Episode 1)</option>
                  <option value="cosmos-laundromat-s1e2">cosmos-laundromat-s1e2 (Series Episode 2)</option>
                  <option value="player-test-sample">player-test-sample (Benchmark Only)</option>
                  <option value="custom">Other / Custom Title ID...</option>
                </select>
                {regContentId === 'custom' && (
                  <input
                    type="text"
                    placeholder="Enter stable internal ID (e.g. charade-1963)"
                    value={customContentId}
                    onChange={(e) => setCustomContentId(e.target.value)}
                    required
                    className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-[#d4af37]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Source Label / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Night of the Living Dead - 1080p Master"
                  value={regTitle}
                  onChange={(e) => setRegTitle(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-white/70 mb-1">Verified Media Stream URL (Direct CDN or origin)</label>
                <input
                  type="url"
                  placeholder="https://.../stream.mp4 or https://.../playlist.m3u8"
                  value={regStreamUrl}
                  onChange={(e) => setRegStreamUrl(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Video Quality</label>
                <select
                  value={regQuality}
                  onChange={(e) => setRegQuality(e.target.value as VideoQuality)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#d4af37]"
                >
                  <option value="1080p">1080p Full HD</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p SD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Format</label>
                <select
                  value={regFormat}
                  onChange={(e) => setRegFormat(e.target.value as MediaFormat)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#d4af37]"
                >
                  <option value="mp4">MP4 (H.264 / AAC)</option>
                  <option value="webm">WebM (VP9 / Opus)</option>
                  <option value="hls">HLS Adaptive (M3U8)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Distribution Rights Authorization</label>
                <select
                  value={regRights}
                  onChange={(e) => setRegRights(e.target.value as DistributionRights)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#d4af37]"
                >
                  <option value="public-domain">Public Domain</option>
                  <option value="creative-commons">Creative Commons (CC-BY)</option>
                  <option value="licensed">Explicitly Licensed / Partner</option>
                  <option value="trailer-only">Trailer Preview Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">CDN Origin / Provider Name</label>
                <input
                  type="text"
                  placeholder="e.g. Internet Archive Global CDN"
                  value={regCdnProvider}
                  onChange={(e) => setRegCdnProvider(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-white/70 mb-1">License Terms & Notice</label>
                <input
                  type="text"
                  placeholder="e.g. Public Domain (1968 U.S. Notice Omission) / CC BY 4.0"
                  value={regLicenseTerms}
                  onChange={(e) => setRegLicenseTerms(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#d4af37] text-black font-bold text-xs hover:bg-amber-400 transition-colors shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Registering Source...' : 'Register Playback Source'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Catalog Rights & Economics Overview */}
        {activeTab === 'audit' && (
          <div className="space-y-4 overflow-y-auto max-h-[55vh] pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-[#d4af37] font-bold mb-1">
                  <DollarSign className="w-4 h-4" /> Zero-Budget Streaming
                </div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  Open films and public domain assets are served via distributed CDN origins (Internet Archive & Blender Foundation), eliminating expensive bandwidth costs ($0.00 hosting overhead).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                  <Globe className="w-4 h-4" /> Global Byte-Range Access
                </div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  Verified streams strictly support HTTP 206 Partial Content byte ranges, enabling instant seeking and responsive scrubber controls without re-downloading entire video payloads.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-blue-400 font-bold mb-1">
                  <ShieldCheck className="w-4 h-4" /> Honest Availability
                </div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  Titles with metadata only (e.g. commercial Hollywood releases or promotional concepts) display transparent &ldquo;TRAILER ONLY&rdquo; statuses rather than falling back to unrelated videos.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-serif font-bold text-white text-sm">Catalog Titles Rights Breakdown</h4>
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-8 h-12 rounded object-cover shrink-0 bg-slate-900"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="font-serif font-bold text-white">{movie.title}</span>
                      <span className="text-white/40 block text-[11px] font-mono">{movie.id} · {movie.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      movie.availabilityLabel === 'PLAYABLE' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {movie.availabilityLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
