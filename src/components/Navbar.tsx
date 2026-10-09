import React, { useState } from 'react';
import { Search, Heart, Download, User, Menu, X, Sparkles, Film, Tv, ShieldCheck, Palette } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenWatchlist: () => void;
  onOpenDownloads: () => void;
  onOpenSettings: () => void;
  onOpenSources: () => void;
  watchlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenWatchlist,
  onOpenDownloads,
  onOpenSettings,
  onOpenSources,
  watchlistCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-color)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark & Nature Emblem */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)] flex items-center justify-center relative shadow-[0_0_15px_rgba(133,163,134,0.3)] bg-[var(--bg-card)]">
            <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] absolute -top-0.5 -right-0.5"></div>
            <span className="font-serif font-bold text-lg text-[var(--text-main)]">O</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold tracking-widest text-[var(--text-main)]">
              ORVIA
            </span>
            <span className="text-[9px] tracking-[0.25em] text-[var(--color-accent)] uppercase font-semibold -mt-1">
              Grove Cinema
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[var(--text-muted)]">
          <button
            onClick={() => setActiveTab('home')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[var(--text-main)] pb-1 border-b-2 ${
              activeTab === 'home' ? 'text-[var(--text-main)] border-[var(--color-accent)]' : 'border-transparent'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[var(--text-main)] pb-1 border-b-2 ${
              activeTab === 'movies' ? 'text-[var(--text-main)] border-[var(--color-accent)]' : 'border-transparent'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setActiveTab('tv')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[var(--text-main)] pb-1 border-b-2 ${
              activeTab === 'tv' ? 'text-[var(--text-main)] border-[var(--color-accent)]' : 'border-transparent'
            }`}
          >
            TV Shows
          </button>
          <button
            onClick={() => setActiveTab('documentary')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[var(--text-main)] pb-1 border-b-2 ${
              activeTab === 'documentary' ? 'text-[var(--text-main)] border-[var(--color-accent)]' : 'border-transparent'
            }`}
          >
            Documentaries
          </button>
          <button
            onClick={() => setActiveTab('classics')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[var(--text-main)] pb-1 border-b-2 ${
              activeTab === 'classics' ? 'text-[var(--text-main)] border-[var(--color-accent)]' : 'border-transparent'
            }`}
          >
            Classics
          </button>
        </nav>

        {/* Zone 3: Primary Actions & Profile */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onOpenSearch}
            className="p-2.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--color-primary)]/20 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all border border-[var(--border-color)] flex items-center gap-2 px-3.5"
            title="Search catalog"
          >
            <Search className="w-4 h-4 text-[var(--color-accent)]" />
            <span className="text-xs font-medium hidden sm:inline">Search...</span>
          </button>

          <button
            onClick={onOpenWatchlist}
            className="p-2.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--color-primary)]/20 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all border border-[var(--border-color)] relative"
            title="My Watchlist"
          >
            <Heart className="w-4 h-4 text-[var(--color-accent)]" />
            {watchlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-accent)] text-black text-[10px] font-bold flex items-center justify-center">
                {watchlistCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenDownloads}
            className="p-2.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--color-primary)]/20 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all border border-[var(--border-color)]"
            title="Telegram Downloads"
          >
            <Download className="w-4 h-4 text-[var(--color-accent)]" />
          </button>

          <button
            onClick={onOpenSources}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--bg-card)] hover:bg-[var(--color-primary)]/20 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all border border-[var(--border-color)] text-xs font-medium"
            title="Content Sources & Rights Audit"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sources</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--color-primary)]/20 border border-[var(--border-color)] transition-all text-[var(--text-main)]"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-xs">
              YR
            </div>
            <span className="text-xs font-medium hidden md:inline">Yuki R.</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg lg:hidden text-[var(--text-main)] hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[var(--bg-surface)] border-b border-[var(--border-color)] px-6 py-4 flex flex-col gap-3">
          <button
            onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
            className={`text-left py-2 px-3 rounded-lg text-sm font-medium ${activeTab === 'home' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-main)]'}`}
          >
            Home
          </button>
          <button
            onClick={() => { setActiveTab('movies'); setMobileMenuOpen(false); }}
            className={`text-left py-2 px-3 rounded-lg text-sm font-medium ${activeTab === 'movies' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-main)]'}`}
          >
            Movies
          </button>
          <button
            onClick={() => { setActiveTab('tv'); setMobileMenuOpen(false); }}
            className={`text-left py-2 px-3 rounded-lg text-sm font-medium ${activeTab === 'tv' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-main)]'}`}
          >
            TV Shows
          </button>
          <button
            onClick={() => { setActiveTab('documentary'); setMobileMenuOpen(false); }}
            className={`text-left py-2 px-3 rounded-lg text-sm font-medium ${activeTab === 'documentary' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-main)]'}`}
          >
            Documentaries
          </button>
          <button
            onClick={() => { setActiveTab('classics'); setMobileMenuOpen(false); }}
            className={`text-left py-2 px-3 rounded-lg text-sm font-medium ${activeTab === 'classics' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-main)]'}`}
          >
            Classics
          </button>
          <button
            onClick={() => { onOpenSources(); setMobileMenuOpen(false); }}
            className="text-left py-2 px-3 rounded-lg text-sm font-medium text-[var(--color-accent)]"
          >
            Sources & Rights Audit
          </button>
        </div>
      )}
    </header>
  );
};
