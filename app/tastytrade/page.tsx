// tastytrade hub: the five steps from read-only watching to automation, each linking to its placeholder page.
import StepHeader from '@/components/tastytrade/StepHeader';
import Card from '@/components/Card';
import CardTitle from '@/components/CardTitle';
import StatusPill from '@/components/StatusPill';
import { AccountBadge } from '@/components/tastytrade/TT';
import { TT_STEPS } from '@/lib/tastytrade-placeholders';

export default function TastytradeHub() {
  return (
    <>
      <StepHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
        {TT_STEPS.map((s) => (
          <a key={s.slug} href={`/tastytrade/${s.slug}`}>
            <Card accent={s.accent} className="h-full">
              <CardTitle icon={s.icon} accent={s.accent}>
                <span className="font-semibold">
                  Step {s.n}: {s.title}
                </span>
              </CardTitle>
              <p className="text-sm text-white/70 mt-3">{s.blurb}</p>
              <div className="mt-3 flex gap-2 flex-wrap">
                <AccountBadge account={s.account} />
                <StatusPill
                  label={
                    !s.enabled
                      ? 'Not enabled'
                      : s.slug === 'watch'
                        ? 'Partially live'
                        : 'Placeholder'
                  }
                  accent={s.enabled ? s.accent : 'pink'}
                />
              </div>
            </Card>
          </a>
        ))}
      </div>
    </>
  );
}
