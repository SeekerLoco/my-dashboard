// Shared dashboard card: navy glass panel with a colored accent stripe along the top.
import type { ReactNode } from 'react';

// Accent colors: top stripe, icon tile background, status pill tint, and page-header glow.
export const ACCENTS = {
  blue: {
    stripe: 'bg-sky-400',
    tile: 'bg-sky-500/80',
    pill: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
    glow: 'shadow-[0_0_32px_rgba(56,189,248,0.16)]',
  },
  green: {
    stripe: 'bg-emerald-400',
    tile: 'bg-emerald-500/80',
    pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    glow: 'shadow-[0_0_32px_rgba(52,211,153,0.16)]',
  },
  teal: {
    stripe: 'bg-teal-400',
    tile: 'bg-teal-500/80',
    pill: 'bg-teal-500/15 text-teal-300 border-teal-400/30',
    glow: 'shadow-[0_0_32px_rgba(45,212,191,0.16)]',
  },
  violet: {
    stripe: 'bg-violet-400',
    tile: 'bg-violet-500/80',
    pill: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
    glow: 'shadow-[0_0_32px_rgba(167,139,250,0.16)]',
  },
  pink: {
    stripe: 'bg-pink-400',
    tile: 'bg-pink-500/80',
    pill: 'bg-pink-500/15 text-pink-300 border-pink-400/30',
    glow: 'shadow-[0_0_32px_rgba(244,114,182,0.16)]',
  },
  orange: {
    stripe: 'bg-orange-400',
    tile: 'bg-orange-500/80',
    pill: 'bg-orange-500/15 text-orange-300 border-orange-400/30',
    glow: 'shadow-[0_0_32px_rgba(251,146,60,0.16)]',
  },
};

export type Accent = keyof typeof ACCENTS;

type CardProps = {
  accent?: Accent;
  className?: string;
  children: ReactNode;
};

export default function Card({ accent, className, children }: CardProps) {
  return (
    <div
      className={`panel relative p-5 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_12px_36px_rgba(10,12,40,0.6),0_0_28px_rgba(129,140,248,0.22)] motion-reduce:transition-none motion-reduce:hover:translate-y-0${className ? ` ${className}` : ''}`}
    >
      {accent && (
        <div
          className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl ${ACCENTS[accent].stripe}`}
        />
      )}
      {children}
    </div>
  );
}
