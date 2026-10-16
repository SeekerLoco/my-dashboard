// Soccer card: link to the soccer games & mileage page.
'use client';

import Card from '@/components/Card';
import CardTitle from '@/components/CardTitle';
import StatusPill from '@/components/StatusPill';

export default function SoccerCard() {
  return (
    <Card accent="orange">
      <div className="flex justify-between items-center">
        <CardTitle icon="⚽" accent="orange">
          <a href="/soccer" className="font-semibold hover:underline">
            Soccer
          </a>
        </CardTitle>
        <StatusPill label="Season" accent="orange" />
      </div>
      <div className="text-sm mt-2 text-slate-400">Games & mileage</div>
    </Card>
  );
}
