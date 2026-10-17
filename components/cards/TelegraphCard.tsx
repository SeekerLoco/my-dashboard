// The Daily Telegraph card: top 5 headlines, each deep-linking to its story on the Telegraph page.
'use client';

import Card from '@/components/Card';
import CardTitle from '@/components/CardTitle';
import StatusPill from '@/components/StatusPill';
import CardFooter from '@/components/CardFooter';
import { getTopHeadlines, issueNumbering, storyHref } from '@/lib/telegraph';
import { parseLocalDate } from '@/lib/dates';

export default function TelegraphCard() {
  const { issue, stories: headlines } = getTopHeadlines();
  return (
    <Card accent="violet">
      <div className="flex justify-between items-center">
        <CardTitle icon="📰" accent="violet">
          <a href="/telegraph" className="font-semibold hover:underline">
            The Daily Telegraph
          </a>
        </CardTitle>
        <StatusPill label="Preview" accent="violet" />
      </div>
      <ol className="mt-3 space-y-2 text-sm">
        {headlines.map((s, i) => (
          <li key={s.id} className="flex gap-2">
            <span className="text-violet-300 font-semibold">{i + 1}.</span>
            <a
              href={storyHref(issue!, s)}
              className="text-slate-200 hover:underline"
            >
              {s.headline}
            </a>
          </li>
        ))}
      </ol>
      {!issue && (
        <div className="mt-3 text-sm text-slate-400">No issues this week.</div>
      )}
      <CardFooter>
        {issue
          ? `${issueNumbering(issue.date).label} · ${parseLocalDate(issue.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : 'Placeholder stories'}
      </CardFooter>
    </Card>
  );
}
