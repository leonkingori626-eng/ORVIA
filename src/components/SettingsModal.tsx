import React from 'react';
import { X, User, Shield, Palette, Globe, Sparkles, Database } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  currentTheme: string;
  setTheme: (theme: 'grove' | 'night' | 'mist') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, currentTheme, setTheme }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.9)] p-6 sm:p-8 flex flex-col gap-6 text-[var(--text-main)]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white font-bold text-sm">
              YR
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg">Yuki R.</h2>
              <p className="text-xs text-[var(--text-muted)]">ORVIA Grove VIP Account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-4">
          
          {/* Theme Selector */}
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-[var(--color-accent)]" />
              <div>
                <h3 className="font-semibold text-sm">Application Theme</h3>
                <p className="text-xs text-[var(--text-muted)]">Choose between Grove, Night, and Mist</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => setTheme('grove')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  currentTheme === 'grove'
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-accent)] shadow-lg'
                    : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 border-[var(--border-color)]'
                }`}
              >
                🌿 Grove (Default)
              </button>

              <button
                onClick={() => setTheme('night')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  currentTheme === 'night'
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-accent)] shadow-lg'
                    : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 border-[var(--border-color)]'
                }`}
              >
                🌙 Night Forest
              </button>

              <button
                onClick={() => setTheme('mist')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  currentTheme === 'mist'
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-accent)] shadow-lg'
                    : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 border-[var(--border-color)]'
                }`}
              >
                🌫️ Mist Graphite
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[var(--color-accent)]" />
              <div>
                <h3 className="font-semibold text-sm">Subscription Tier</h3>
                <p className="text-xs text-[var(--text-muted)]">Unlimited 4K Cinematic Access</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">Active VIP</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-[var(--color-accent)]" />
              <div>
                <h3 className="font-semibold text-sm">Storage Persistence</h3>
                <p className="text-xs text-[var(--text-muted)]">Watchlist, Themes & Continue Watching synced</p>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-medium">Synced</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-sm transition-all shadow-md"
          >
            Save & Close
          </button>
        </div>

      </div>
    </div>
  );
};
