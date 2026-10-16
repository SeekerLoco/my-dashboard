// Shared dashboard card: navy glass panel with a colored accent stripe along the top.
import type { ReactNode } from 'react';

// Accent colors: stripe on the card and background of the icon tile.
export const ACCENTS = {
  blue: { stripe: 'bg-sky-400', tile: 'bg-sky-500/80' },
  green: { stripe: 'bg-emerald-400', tile: 'bg-emerald-500/80' },
  teal: { stripe: 'bg-teal-400', tile: 'bg-teal-500/80' },
  violet: { stripe: 'bg-violet-400', tile: 'bg-violet-500/80' },
  pink: { stripe: 'bg-pink-400', tile: 'bg-pink-500/80' },
  orange: { stripe: 'bg-orange-400', tile: 'bg-orange-500/80' },
};

export type Accent = keyof typeof ACCENTS;

type CardProps = {
  accent?: Accent;
  className?: string;
  children: ReactNode;
};

export default function Card({ accent, className, children }: CardProps) {
  return (
    <div className={`panel relative p-5${className ? ` ${className}` : ''}`}>
      {accent && (
        <div
          className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl ${ACCENTS[accent].stripe}`}
        />
      )}
      {children}
    </div>
  );
}
