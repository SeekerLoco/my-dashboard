// The Daily Telegraph page: newspaper layout with in-place section tabs and deep links (?issue=YYYY-MM-DD&section=…#story-id), plus a 7-day edition picker.
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Playfair_Display } from 'next/font/google';
import PageHeader from '@/components/PageHeader';
import { getLocalDateString, parseLocalDate } from '@/lib/dates';
import Sparkline from '@/components/charts/Sparkline';
import {
  SECTIONS,
  getRecentIssues,
  issueNumbering,
  resolveIssue,
  sectionLabel,
  type Section,
  type SectionId,
  type Story,
} from '@/lib/telegraph';

const serif = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
});

const isSection = (v: string | null): v is SectionId =>
  SECTIONS.some((s) => s.id === v);

function formatDate(d: string) {
  return parseLocalDate(d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// published_at is either date-only ('2026-10-17', a local date) or a full timestamp (converted to local); date only, no time.
function formatPublished(v: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return formatDate(v);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : formatDate(getLocalDateString(d));
}

export default function TelegraphPage() {
  const router = useRouter();
  const [section, setSection] = useState<SectionId>('front');
  const [issueDate, setIssueDate] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  // Read deep link (?section=…#id) on load, then scroll to and highlight the story.
  // Deferred one tick so state isn't set synchronously inside the effect.
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('section');
      if (isSection(s)) setSection(s);
      setIssueDate(resolveIssue(params.get('issue'))?.date ?? null);
      const id = window.location.hash.slice(1);
      if (id) {
        setHighlight(id);
        setTimeout(() => {
          document
            .getElementById(id)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        setTimeout(() => setHighlight(null), 2500);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const recent = getRecentIssues();
  const issue = resolveIssue(issueDate);

  // Update the URL query in place (no navigation); omit defaults to keep it short.
  function sync(nextIssue: string | undefined, nextSection: SectionId) {
    const q = new URLSearchParams();
    if (nextIssue && nextIssue !== recent[0]?.date) q.set('issue', nextIssue);
    if (nextSection !== 'front') q.set('section', nextSection);
    const qs = q.toString();
    router.replace(qs ? `/telegraph?${qs}` : '/telegraph', { scroll: false });
  }

  function pick(id: SectionId) {
    setSection(id);
    setHighlight(null);
    sync(issue?.date, id);
  }

  function pickIssue(date: string) {
    setIssueDate(date);
    setHighlight(null);
    sync(date, section);
  }

  const sec = issue?.sections[section];
  const issueLine = issue ? formatDate(issue.date) : 'No issues this week';
  const label = SECTIONS.find((s) => s.id === section)?.label;

  return (
    <main className="min-h-screen p-6 text-white">
      <PageHeader title="The Daily Telegraph" icon="📰" accent="violet" />

      <article
        className={`${serif.className} fade-in rounded-2xl bg-[#f4efe3] text-stone-900 shadow-[0_12px_40px_rgba(0,0,0,0.5)] px-6 py-6 md:px-10`}
      >
        {/* Masthead */}
        <div className="flex justify-between text-xs uppercase tracking-widest text-stone-600 border-b border-stone-400 pb-2">
          <span>{issue ? issueNumbering(issue.date).label : '—'}</span>
          <span>Daily Edition</span>
          <span>Price: One Smile</span>
        </div>
        <h2 className="text-center text-5xl md:text-7xl font-black tracking-tight py-4">
          The Daily Telegraph
        </h2>
        <div className="text-center text-sm italic text-stone-700 border-y-4 border-double border-stone-800 py-1">
          {issueLine} ·{' '}
          {issue?.editor
            ? `Edited by ${issue.editor}`
            : 'All the news that’s fit to print'}
        </div>

        {/* Edition picker: issues from the last 7 days, newest first */}
        {recent.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 pt-3 text-xs uppercase tracking-wider">
            {recent.map((i) => (
              <button
                key={i.date}
                onClick={() => pickIssue(i.date)}
                className={`px-2 py-0.5 rounded border transition ${i.date === issue?.date ? 'border-stone-900 bg-stone-900 text-[#f4efe3]' : 'border-stone-400 text-stone-600 hover:text-stone-900'}`}
              >
                No. {issueNumbering(i.date).number} ·{' '}
                {parseLocalDate(i.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </button>
            ))}
          </div>
        )}

        {/* Section sub-headers */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 border-b border-stone-400 py-3 text-sm uppercase tracking-wider">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => pick(s.id)}
              className={`pb-0.5 border-b-2 transition ${section === s.id ? 'border-stone-900 font-bold' : 'border-transparent text-stone-600 hover:text-stone-900'}`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {section !== 'front' && (
          <h3 className="mt-5 text-center text-2xl font-bold italic">
            {label}
          </h3>
        )}

        {!issue ? (
          <p className="mt-6 text-center italic text-stone-600">
            No issues this week.
          </p>
        ) : !sec?.available ? (
          <p className="mt-6 text-center italic text-stone-600">
            This section is unavailable in this edition
            {sec?.status ? ` (${sec.status})` : ''}.
          </p>
        ) : (
          <>
            {section === 'markets' && <MarketsBlock sec={sec} />}
            {section === 'weather' && <WeatherBlock sec={sec} />}
            {section === 'sports' && <ScoresBlock sec={sec} />}
            <StoryGrid
              stories={sec.stories}
              highlight={highlight}
              showFrom={section === 'front'}
              empty={section !== 'markets' && section !== 'weather'}
            />
          </>
        )}
      </article>
    </main>
  );
}

// Markets values may be null/missing: show 'n/a' instead of NaN.
const num = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);
const fixed = (v: unknown, d = 2) => (num(v) ? v.toFixed(d) : 'n/a');
const pct = (v: unknown) =>
  num(v) ? `${v > 0 ? '+' : ''}${v.toFixed(2)}%` : 'n/a';
const pctClass = (v: unknown) =>
  num(v) ? (v >= 0 ? 'text-emerald-800' : 'text-red-800') : 'text-stone-500';

function SourceLine({ story }: { story: Story }) {
  if (!story.source_name && !story.source_url) return null;
  return (
    <p className="mt-1 text-xs text-stone-600">
      Source:{' '}
      {story.source_url ? (
        <a
          href={story.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-stone-900"
        >
          {story.source_name || story.source_url}
        </a>
      ) : (
        story.source_name
      )}
    </p>
  );
}

function StoryGrid({
  stories,
  highlight,
  showFrom,
  empty,
}: {
  stories: Story[];
  highlight: string | null;
  showFrom?: boolean;
  empty?: boolean;
}) {
  const [lead, ...rest] = stories;
  if (!lead)
    return empty ? (
      <p className="mt-6 text-center italic text-stone-600">No stories yet.</p>
    ) : null;
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-3">
      <StoryBlock
        story={lead}
        lead
        showFrom={showFrom}
        highlight={highlight === lead.id}
      />
      <div className="lg:border-l lg:border-stone-400 lg:pl-8 space-y-6 divide-y divide-stone-300">
        {rest.map((s) => (
          <StoryBlock
            key={s.id}
            story={s}
            showFrom={showFrom}
            highlight={highlight === s.id}
          />
        ))}
      </div>
    </div>
  );
}

function MarketsBlock({ sec }: { sec: Section }) {
  const b = sec.breadth;
  return (
    <div className="mt-6 space-y-6">
      {sec.table && sec.table.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-y-2 border-stone-800">
            <thead className="text-xs uppercase tracking-wider text-stone-600 border-b border-stone-400">
              <tr>
                <th className="text-left py-1 pr-2">Index</th>
                <th className="text-right px-2">Close</th>
                <th className="text-right px-2">Day</th>
                <th className="text-right px-2">Week</th>
                <th className="text-right px-2">Month</th>
                <th className="text-right px-2">YTD</th>
                <th className="text-center px-2">40-wk</th>
                <th className="text-right px-2">RSI 14</th>
                <th className="text-right pl-2">MACD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-300">
              {sec.table.map((r) => {
                const rsi = (r.rsi_series ?? []).filter(num);
                const macd = (r.macd_series ?? [])
                  .map((m) => m?.macd)
                  .filter(num);
                return (
                  <tr key={r.symbol}>
                    <td className="py-1 pr-2">
                      <span className="font-bold">{r.name}</span>{' '}
                      <span className="text-xs text-stone-500">{r.symbol}</span>
                    </td>
                    <td className="text-right px-2 tabular-nums">
                      {num(r.last_close)
                        ? r.last_close.toLocaleString('en-US', {
                            maximumFractionDigits: 2,
                          })
                        : 'n/a'}
                    </td>
                    {[r.pct_day, r.pct_week, r.pct_month, r.pct_ytd].map(
                      (v, i) => (
                        <td
                          key={i}
                          className={`text-right px-2 tabular-nums ${pctClass(v)}`}
                        >
                          {pct(v)}
                        </td>
                      ),
                    )}
                    <td className="text-center px-2">
                      {r.vs_40wk_sma ?? 'n/a'}
                    </td>
                    <td className="text-right px-2 tabular-nums whitespace-nowrap">
                      {fixed(r.rsi_14, 1)}
                      <Sparkline
                        data={rsi}
                        positive={rsi[rsi.length - 1] >= rsi[0]}
                      />
                    </td>
                    <td className="text-right pl-2 tabular-nums whitespace-nowrap">
                      {fixed(r.macd?.histogram)}
                      <Sparkline
                        data={macd}
                        positive={
                          (num(r.macd?.histogram) ? r.macd.histogram : 0) >= 0
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-1 text-xs text-stone-500">
            {sec.as_of_close ? `As of close ${sec.as_of_close}. ` : ''}MACD
            column shows the histogram; sparklines show recent RSI and MACD
            line.
          </p>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-3">
        {b && (
          <div className="border border-stone-400 p-3">
            <div className="text-xs uppercase tracking-wider text-stone-600">
              {b.label ?? 'Market breadth'}
            </div>
            <div className="text-3xl font-black">
              {fixed(b.value, 1)}
              {b.direction && (
                <span className="ml-2 text-base font-normal italic">
                  {b.direction}
                </span>
              )}
            </div>
            {num(b.prior_value) && (
              <div className="text-xs text-stone-600">
                Prior: {b.prior_value.toFixed(1)}
              </div>
            )}
            {b.reading && (
              <div className="mt-1 text-sm font-bold uppercase">
                {b.reading}
              </div>
            )}
            {b.note && <div className="text-xs text-stone-500">{b.note}</div>}
          </div>
        )}
        {sec.summary && (
          <p className="md:col-span-2 leading-relaxed first-letter:text-4xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:leading-none">
            {sec.summary}
          </p>
        )}
      </div>
      {sec.portfolio_news && sec.portfolio_news.length > 0 && (
        <div>
          <h4 className="text-lg font-black border-b border-stone-800 mb-2">
            News by Symbol
          </h4>
          <div className="grid gap-4 md:grid-cols-3">
            {sec.portfolio_news.map((p) => (
              <div key={p.symbol}>
                <div className="font-bold tracking-wider">{p.symbol}</div>
                {(p.stories ?? []).length === 0 && (
                  <p className="text-sm italic text-stone-500">No news.</p>
                )}
                {(p.stories ?? []).map((st, i) => (
                  <div key={i} className="mt-2 text-sm">
                    <div className="font-bold leading-snug">{st.headline}</div>
                    {st.summary && (
                      <div className="text-stone-700">{st.summary}</div>
                    )}
                    <SourceLine story={{ ...st, id: `${p.symbol}-${i}` }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherBlock({ sec }: { sec: Section }) {
  return (
    <div className="mt-6 space-y-6">
      {sec.summary && (
        <p className="text-lg leading-relaxed md:columns-2 gap-8 first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:leading-none">
          {sec.summary}
        </p>
      )}
      {sec.maps && sec.maps.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {sec.maps.map((m, i) => (
            <figure key={i} className="border border-stone-400 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.image_url}
                alt={m.title ?? 'Weather map'}
                className="w-full h-auto"
                loading="lazy"
              />
              <figcaption className="mt-1 text-xs text-stone-600">
                {m.title}
                {m.source_url && (
                  <>
                    {' · '}
                    <a
                      href={m.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {m.source_name ?? 'Source'}
                    </a>
                  </>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoresBlock({ sec }: { sec: Section }) {
  if (!sec.scores || sec.scores.length === 0) return null;
  return (
    <div className="mt-6">
      <h4 className="text-lg font-black border-b border-stone-800 mb-2">
        Scoreboard
      </h4>
      <ul className="grid gap-x-8 gap-y-1 md:grid-cols-2 text-sm">
        {sec.scores.map((sc, i) => (
          <li
            key={i}
            className="flex justify-between border-b border-stone-300 py-1"
          >
            <span>
              <span className="font-bold">{sc.team}</span>
              {sc.opponent && ` vs. ${sc.opponent}`}
              {sc.date && (
                <span className="text-xs text-stone-500"> · {sc.date}</span>
              )}
            </span>
            <span className="tabular-nums">
              {sc.result && <span className="font-bold mr-1">{sc.result}</span>}
              {sc.source_url ? (
                <a
                  href={sc.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {sc.score ?? 'Box score'}
                </a>
              ) : (
                sc.score
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StoryBlock({
  story,
  lead,
  highlight,
  showFrom,
}: {
  story: Story;
  lead?: boolean;
  highlight?: boolean;
  showFrom?: boolean;
}) {
  const from = showFrom ? sectionLabel(story.from_section) : undefined;
  const meta = [
    story.byline,
    story.location,
    story.impact && `Impact: ${story.impact}`,
    story.published_at && formatPublished(story.published_at),
  ].filter(Boolean);
  return (
    <section
      id={story.id}
      className={`scroll-mt-24 rounded transition-colors duration-700 ${lead ? 'lg:col-span-2' : 'pt-6 first:pt-0'} ${highlight ? 'bg-amber-200/70' : ''}`}
    >
      {from && (
        <div className="text-xs uppercase tracking-widest text-stone-500">
          {from}
        </div>
      )}
      <h4
        className={`font-black leading-tight ${lead ? 'text-4xl' : 'text-xl'}`}
      >
        {story.headline}
      </h4>
      {story.summary && (
        <p
          className={`mt-2 italic text-stone-700 ${lead ? 'text-lg' : 'text-sm'}`}
        >
          {story.summary}
        </p>
      )}
      {meta.length > 0 && (
        <p className="mt-2 text-xs uppercase tracking-wider text-stone-500">
          {meta.join(' · ')}
        </p>
      )}
      <SourceLine story={story} />
      {story.body && story.body.length > 0 && (
        <div
          className={`mt-3 text-stone-800 leading-relaxed ${lead ? 'md:columns-2 gap-8' : 'text-sm'}`}
        >
          {story.body.map((p, i) => (
            <p
              key={i}
              className={`mb-3 ${lead && i === 0 ? 'first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:leading-none' : ''}`}
            >
              {p}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
