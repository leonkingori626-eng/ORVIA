import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, Globe, DollarSign, Cpu, FileText } from 'lucide-react';
import { PlaybackSourceRecord, Movie } from '../types';
import { verifyAllContentSources } from '../services/contentRegistry';

interface SourcesAuditModalProps {
  movies: Movie[];
  onClose: () => void;
}

export const SourcesAuditModal: React.FC<SourcesAuditModalProps> = ({ movies, onClose }) => {
  const [sources, setSources] = useState<Record<string, PlaybackSourceRecord>>(() => {
    const map: Record<string, PlaybackSourceRecord> = {};
    movies.forEach((m) => {
      if (m.sourceRecord) {
        map[m.id] = m.sourceRecord;
      }
    });
    return map;
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>(new Date().toLocaleTimeString());

  const handleRunVerification = async () => {
    setIsVerifying(true);
    const updated = await verifyAllContentSources();
    setSources(updated);
    setLastCheckTime(new Date().toLocaleTimeString());
    setIsVerifying(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0b0c10] border border-white/15 rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-6 sm:p-8 flex flex-col gap-6 my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-white text-xl">Content Sources & Rights Audit Registry</h2>
              <p className="text-xs text-white/50">Genuine availability checker, rights terms, and CDN hosting economics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Actions & Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 border border-white/10 p-4 rounded-xl">
          <div className="flex items-center gap-3 text-xs text-white/70">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Active Verified Streams: {Object.values(sources).filter(s => s.availabilityStatus === 'verified' || s.availabilityStatus === 'active').length}</span>
            <span aria-hidden="true">·</span>
            <span>Last Live Probe: {lastCheckTime}</span>
          </div>

          <button
            onClick={handleRunVerification}
            disabled={isVerifying}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4af37] text-black font-bold text-xs hover:bg-amber-400 transition-colors shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Running Content Probe...' : 'Run Live Verification Check'}
          </button>
        </div>

        {/* Source Table / Cards */}
        <div className="overflow-y-auto space-y-4 max-h-[50vh] pr-1">
          {movies.map((movie) => {
            const record = sources[movie.id] || movie.sourceRecord;
            if (!record) return null;

            const isVerified = record.availabilityStatus === 'verified' || record.availabilityStatus === 'active';
            const isDegraded = record.availabilityStatus === 'degraded';

            return (
              <div key={movie.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 overflow-hidden">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-12 h-16 rounded object-cover bg-slate-900 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="overflow-hidden">
                    <h3 className="font-serif font-bold text-white text-sm truncate">{movie.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                      <span className="text-[#d4af37] font-medium">{record.providerName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">HTTP {record.httpStatusCode}</span>
                    </div>
                    <div className="text-[11px] text-white/40 mt-1 truncate max-w-md">
                      Rights: {record.rightsTerms}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right hidden md:block text-xs font-mono text-white/60">
                    <div>Cost: {record.estimatedHostingCost}</div>
                    <div>{record.geographicLimit}</div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    isDegraded ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {record.playbackType}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Economic & Legal Footer notes */}
        <div className="border-t border-white/10 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/60">
          <div className="flex items-start gap-2.5">
            <DollarSign className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Zero Budget Architecture</strong>
              Using authorized public domain and Creative Commons CDN endpoints yields $0.00 hosting overhead.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Globe className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Geographic Limits</strong>
              Global CDN edge nodes ensure low latency across all international regions without geo-blocking.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Compliance & Rights</strong>
              Full compliance with CC-BY and public domain redistribution terms with explicit provider attribution.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
