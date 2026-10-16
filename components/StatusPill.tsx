// Small rounded status pill tinted with a card's accent color, with an optional green "live" dot.
import { ACCENTS, type Accent } from '@/components/Card';

export default function StatusPill({
  label,
  accent,
  live = false,
}: {
  label: string;
  accent: Accent;
  live?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${ACCENTS[accent].pill}`}
      >
        {label}
      </span>
      {live && (
        <span
          className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.9)]"
          title="Live"
        />
      )}
    </span>
  );
}
