import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, History, PlusCircle, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isNavActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-earth-surface border-b border-earth-sand sticky top-0 z-40 shadow-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-earth-primary flex items-center justify-center text-earth-surface shadow-sm group-hover:bg-earth-terracotta transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold font-serif tracking-tight text-earth-deep">
              Ledgerly
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-earth-sand text-earth-deep">
              AI Business Intelligence
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              isNavActive('/')
                ? 'bg-earth-sand text-earth-deep font-semibold'
                : 'text-earth-muted hover:text-earth-deep hover:bg-earth-bg'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-earth-terracotta" />
            <span>New Report</span>
          </Link>

          <Link
            to="/compare"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              isNavActive('/compare')
                ? 'bg-earth-sand text-earth-deep font-semibold'
                : 'text-earth-muted hover:text-earth-deep hover:bg-earth-bg'
            }`}
          >
            <span className="font-mono text-xs font-bold px-1 rounded bg-earth-terracotta/15 text-earth-terracotta">v1-v3</span>
            <span>Compare</span>
          </Link>

          <Link
            to="/reports"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              isNavActive('/reports')
                ? 'bg-earth-sand text-earth-deep font-semibold'
                : 'text-earth-muted hover:text-earth-deep hover:bg-earth-bg'
            }`}
          >
            <History className="w-4 h-4 text-earth-primary" />
            <span>History</span>
          </Link>

          {/* Factual Guarantee Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-earth-bg border border-earth-sand text-xs text-earth-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-earth-olive" />
            <span>Deterministic Grounding</span>
          </div>
        </nav>
      </div>
    </header>
  );
};

