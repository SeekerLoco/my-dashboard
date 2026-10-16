// Sub-page header: accent stripe and glow, emoji icon tile, title, and a back link (Dashboard by default).
import type { ReactNode } from 'react';
import { ACCENTS, type Accent } from '@/components/Card';

export default function PageHeader({
  title,
  icon,
  accent,
  backHref = '/',
  backLabel = 'Dashboard',
  children,
}: {
  title: string;
  icon: string;
  accent: Accent;
  backHref?: string;
  backLabel?: string;
  // Optional extra content under the title row (e.g. sub-page links)
  children?: ReactNode;
}) {
  return (
    <header
      className={`panel fade-in relative mb-6 px-5 py-4 ${ACCENTS[accent].glow}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl ${ACCENTS[accent].stripe}`}
      />
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span
            className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl text-xl shadow-md ${ACCENTS[accent].tile}`}
          >
            {icon}
          </span>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <a href={backHref} className="text-blue-400 hover:underline">
          ← {backLabel}
        </a>
      </div>
      {children}
    </header>
  );
}
