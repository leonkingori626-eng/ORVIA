import React from 'react';
import { Sparkles, Shield, Film, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050608] border-t border-white/10 text-white/60 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
        
        {/* Brand column */}
        <div className="flex flex-col gap-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#d4af37] flex items-center justify-center">
              <span className="font-serif font-bold text-sm text-[#f5f5f7]">O</span>
            </div>
            <span className="font-serif text-xl font-bold tracking-widest text-white">ORVIA</span>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            A universe of stories. Premium international cinematic streaming platform featuring authorized metadata, immersive playback, and Telegram downloads.
          </p>
          <span className="text-[11px] text-[#d4af37] font-medium">© 2026 ORVIA Entertainment Inc. All rights reserved.</span>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-3">
          <h4 className="font-serif text-white font-semibold text-sm tracking-wide">Navigation</h4>
          <a href="#home" className="text-xs hover:text-white transition-colors">Home Discovery</a>
          <a href="#movies" className="text-xs hover:text-white transition-colors">Cinematic Movies</a>
          <a href="#tv" className="text-xs hover:text-white transition-colors">TV Shows & Series</a>
          <a href="#documentaries" className="text-xs hover:text-white transition-colors">Documentaries</a>
        </div>

        {/* Legal & Compliance */}
        <div className="flex flex-col gap-3">
          <h4 className="font-serif text-white font-semibold text-sm tracking-wide">Legal & Privacy</h4>
          <a href="#privacy" className="text-xs hover:text-white transition-colors">Privacy Policy</a>
          <a href="#terms" className="text-xs hover:text-white transition-colors">Terms of Use</a>
          <a href="#copyright" className="text-xs hover:text-white transition-colors">Copyright & DMCA</a>
          <a href="#support" className="text-xs hover:text-white transition-colors">Content Removal Contact</a>
        </div>

        {/* Attribution */}
        <div className="flex flex-col gap-3">
          <h4 className="font-serif text-white font-semibold text-sm tracking-wide">Authorized Providers</h4>
          <p className="text-xs text-white/50 leading-relaxed">
            Metadata indexed from verified open catalogs and authorized sample providers complying with DMCA and open-content licensing terms.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 mt-1">
            <Shield className="w-4 h-4" />
            <span>Fully Authorized & Compliant</span>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
        <span>Designed for cinematic excellence with zero-compromise performance.</span>
        <span className="flex items-center gap-1">
          Crafted with <Heart className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" /> for cinema lovers worldwide.
        </span>
      </div>
    </footer>
  );
};
