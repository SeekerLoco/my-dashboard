// Card title row piece: a rounded emoji icon tile in the card's accent color, followed by the title.
import type { ReactNode } from 'react';
import { ACCENTS, type Accent } from '@/components/Card';

export default function CardTitle({
  icon,
  accent,
  children,
}: {
  icon: string;
  accent: Accent;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl text-xl shadow-md ${ACCENTS[accent].tile}`}
      >
        {icon}
      </span>
      {children}
    </div>
  );
}
