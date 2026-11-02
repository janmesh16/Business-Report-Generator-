import React from 'react';
import { Compass, BarChart2, Target, AlertTriangle, Table, Layers, FileText } from 'lucide-react';

interface StickyNavProps {
  activeSection?: string;
}

export const StickyNav: React.FC<StickyNavProps> = () => {
  const sections = [
    { id: 'section-kpis', label: 'KPIs', icon: BarChart2 },
    { id: 'section-summary', label: 'Summary', icon: Compass },
    { id: 'section-about', label: 'About Data', icon: Layers },
    { id: 'section-findings', label: 'Findings', icon: FileText },
    { id: 'section-visuals', label: 'Visual Analysis', icon: BarChart2 },
    { id: 'section-recs', label: 'Recommendations', icon: Target },
    { id: 'section-risks', label: 'Risks & Quality', icon: AlertTriangle },
    { id: 'section-appendix', label: 'Appendix', icon: Table },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-16 z-30 bg-earth-surface/95 backdrop-blur-md border-b border-earth-sand py-2.5 px-4 mb-6 rounded-2xl shadow-xs no-print flex items-center justify-between overflow-x-auto">
      <div className="flex items-center gap-1 sm:gap-2">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollTo(sec.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-earth-muted hover:text-earth-deep hover:bg-earth-sand/40 transition-colors shrink-0"
            >
              <Icon className="w-3.5 h-3.5 text-earth-primary" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>
      <div className="hidden lg:block text-[11px] text-earth-muted shrink-0">
        Traceable to source records
      </div>
    </nav>
  );
};
