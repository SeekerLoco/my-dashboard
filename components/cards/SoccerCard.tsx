// Soccer card: link to the soccer games & mileage page.
'use client';

import Card from '@/components/Card';

export default function SoccerCard() {
  return (
    <Card>
      <a href="/soccer" className="font-semibold hover:underline">
        Soccer
      </a>
      <div className="text-sm mt-2 text-slate-400">Games & mileage</div>
    </Card>
  );
}
