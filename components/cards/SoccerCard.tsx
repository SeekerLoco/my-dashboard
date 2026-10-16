// Soccer card: link to the soccer games & mileage page.
'use client';

import Card from '@/components/Card';

export default function SoccerCard({ dark }: { dark: boolean }) {
  return (
    <Card dark={dark}>
      <a href="/soccer" className="font-semibold hover:underline">
        Soccer
      </a>
      <div
        className={`text-sm mt-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`}
      >
        Games & mileage
      </div>
    </Card>
  );
}
