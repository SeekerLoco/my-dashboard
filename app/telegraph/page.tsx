// The Daily Telegraph page: newspaper layout with in-place section tabs and deep links (?section=…#story-id).
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Playfair_Display } from 'next/font/google';
import PageHeader from '@/components/PageHeader';
import {
  SECTIONS,
  getSectionStories,
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
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TelegraphPage() {
  const router = useRouter();
  const [section, setSection] = useState<SectionId>('front');
  const [highlight, setHighlight] = useState<string | null>(null);

  // Read deep link (?section=…#id) on load, then scroll to and highlight the story.
  // Deferred one tick so state isn't set synchronously inside the effect.
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('section');
      if (isSection(s)) setSection(s);
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

  function pick(id: SectionId) {
    setSection(id);
    setHighlight(null);
    router.replace(id === 'front' ? '/telegraph' : `/telegraph?section=${id}`, {
      scroll: false,
    });
  }

  const stories = getSectionStories(section);
  const [lead, ...rest] = stories;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const label = SECTIONS.find((s) => s.id === section)?.label;

  return (
    <main className="min-h-screen p-6 text-white">
      <PageHeader title="The Daily Telegraph" icon="📰" accent="violet" />

      <article
        className={`${serif.className} fade-in rounded-2xl bg-[#f4efe3] text-stone-900 shadow-[0_12px_40px_rgba(0,0,0,0.5)] px-6 py-6 md:px-10`}
      >
        {/* Masthead */}
        <div className="flex justify-between text-xs uppercase tracking-widest text-stone-600 border-b border-stone-400 pb-2">
          <span>Vol. I · No. 1</span>
          <span>Experimental Edition</span>
          <span>Price: One Smile</span>
        </div>
        <h2 className="text-center text-5xl md:text-7xl font-black tracking-tight py-4">
          The Daily Telegraph
        </h2>
        <div className="text-center text-sm italic text-stone-700 border-y-4 border-double border-stone-800 py-1">
          {today} · All the news that’s fit to make up
        </div>

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

        {lead ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            <StoryBlock story={lead} lead highlight={highlight === lead.id} />
            <div className="lg:border-l lg:border-stone-400 lg:pl-8 space-y-6 divide-y divide-stone-300">
              {rest.map((s) => (
                <StoryBlock
                  key={s.id}
                  story={s}
                  highlight={highlight === s.id}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-6 text-center italic text-stone-600">
            No stories yet.
          </p>
        )}
      </article>
    </main>
  );
}

function StoryBlock({
  story,
  lead,
  highlight,
}: {
  story: Story;
  lead?: boolean;
  highlight?: boolean;
}) {
  return (
    <section
      id={story.id}
      className={`scroll-mt-24 rounded transition-colors duration-700 ${lead ? 'lg:col-span-2' : 'pt-6 first:pt-0'} ${highlight ? 'bg-amber-200/70' : ''}`}
    >
      <h4
        className={`font-black leading-tight ${lead ? 'text-4xl' : 'text-xl'}`}
      >
        {story.headline}
      </h4>
      <p
        className={`mt-2 italic text-stone-700 ${lead ? 'text-lg' : 'text-sm'}`}
      >
        {story.dek}
      </p>
      <p className="mt-2 text-xs uppercase tracking-wider text-stone-500">
        {story.byline} · {formatDate(story.date)}
      </p>
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
    </section>
  );
}
