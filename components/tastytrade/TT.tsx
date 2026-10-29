'use client';

// Shared tastytrade placeholder pieces: account badge, example label, sections, and the not-enabled banner.
import { useState, type ReactNode } from 'react';
import Card, { type Accent } from '@/components/Card';
import type { AccountKind } from '@/lib/tastytrade-placeholders';

export function AccountBadge({ account }: { account: AccountKind }) {
  const cls =
    account === 'Live'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
      : 'bg-amber-500/15 text-amber-300 border-amber-400/30';
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${cls}`}
    >
      {account === 'Live' ? '● Live account' : '◐ Sandbox account'}
    </span>
  );
}

export function ExampleLabel() {
  return (
    <span className="px-2 py-0.5 rounded-full border border-yellow-400/30 bg-yellow-500/10 text-yellow-300 text-[10px] font-semibold uppercase tracking-wide">
      Example data
    </span>
  );
}

export function Section({
  title,
  accent,
  example = true,
  className,
  collapsible = false,
  defaultOpen = true,
  summary,
  children,
}: {
  title: string;
  accent: Accent;
  example?: boolean;
  className?: string;
  // When collapsible, the title toggles the body; summary shows while collapsed.
  collapsible?: boolean;
  defaultOpen?: boolean;
  summary?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const shown = !collapsible || open;
  return (
    <Card accent={accent} className={className}>
      <div
        className={`flex items-center justify-between gap-2 ${shown ? 'mb-3' : ''}`}
      >
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex items-center gap-2 font-semibold hover:text-white/80"
          >
            <span
              className={`inline-block transition-transform ${open ? 'rotate-90' : ''}`}
            >
              ▸
            </span>
            {title}
            {!open && summary && (
              <span className="text-xs font-normal text-white/60">
                {summary}
              </span>
            )}
          </button>
        ) : (
          <h2 className="font-semibold">{title}</h2>
        )}
        {example && <ExampleLabel />}
      </div>
      {shown && children}
    </Card>
  );
}

export function NotEnabled({ what }: { what: string }) {
  return (
    <div className="panel mb-4 p-5 border-2 border-red-400/40 bg-red-500/10 text-center">
      <p className="text-xl font-bold text-red-300">⛔ Not enabled</p>
      <p className="text-sm text-white/70 mt-1">
        {what} is off until Johnny turns it on. Everything below is a preview.
      </p>
    </div>
  );
}

export function Table({
  head,
  rows,
}: {
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/60">
            {head.map((h) => (
              <th key={h} className="py-1 pr-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/10">
              {r.map((c, j) => (
                <td key={j} className="py-1.5 pr-3">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KV({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 text-sm">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl bg-white/5 p-2">
          <dt className="text-white/60 text-xs">{i.label}</dt>
          <dd className="font-semibold">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
