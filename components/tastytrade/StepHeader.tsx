// Header for a tastytrade step page: PageHeader with step nav and the Live/Sandbox account badge.
import PageHeader from '@/components/PageHeader';
import { TT_STEPS } from '@/lib/tastytrade-placeholders';
import { AccountBadge } from '@/components/tastytrade/TT';

export default function StepHeader({ slug }: { slug?: string }) {
  const step = TT_STEPS.find((s) => s.slug === slug);
  return (
    <PageHeader
      title={step ? `Step ${step.n}: ${step.title}` : 'tastytrade'}
      icon={step ? step.icon : '📈'}
      accent={step ? step.accent : 'orange'}
      backHref={step ? '/tastytrade' : '/'}
      backLabel={step ? 'tastytrade' : 'Dashboard'}
    >
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <AccountBadge account={step ? step.account : 'Live'} />
        <nav className="flex flex-wrap gap-2 ml-auto">
          <a
            href="/tastytrade"
            className={`px-2.5 py-0.5 rounded-full border ${!step ? 'border-white/40 bg-white/10' : 'border-white/10 hover:bg-white/5'}`}
          >
            Hub
          </a>
          {TT_STEPS.map((s) => (
            <a
              key={s.slug}
              href={`/tastytrade/${s.slug}`}
              className={`px-2.5 py-0.5 rounded-full border ${s.slug === slug ? 'border-white/40 bg-white/10' : 'border-white/10 hover:bg-white/5'}`}
            >
              {s.n}. {s.title}
            </a>
          ))}
        </nav>
      </div>
    </PageHeader>
  );
}
