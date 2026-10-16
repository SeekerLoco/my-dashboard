// Small gray "updated" line at the bottom of a card.
import type { ReactNode } from 'react';

export default function CardFooter({ children }: { children: ReactNode }) {
  return <div className="mt-3 text-xs text-slate-400">{children}</div>;
}
