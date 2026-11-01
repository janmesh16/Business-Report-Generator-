import React from 'react';
import { Shield, Sparkles, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-earth-surface border-t border-earth-sand mt-20 text-earth-muted text-sm py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-earth-deep">Ledgerly</span>
          <span>— Transform raw numbers into executive confidence.</span>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-earth-olive" />
            <span>Ephemeral uploads (deleted immediately)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-earth-terracotta" />
            <span>In-code arithmetic (Zero LLM hallucination)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-earth-primary" />
            <span>Decision-ready reports</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

