// SDLT card: progress-to-goal donut and monthly interest history chart.
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dates';
import Card from '@/components/Card';
import DonutChart from '@/components/charts/DonutChart';
import InterestChart from '@/components/charts/InterestChart';
import type { InterestPoint } from '@/lib/types';

export default function SdltCard() {
  const [sdltProgress, setSdltProgress] = useState<number | null>(null);
  const [interestData, setInterestData] = useState<InterestPoint[]>([]);

  // Reads Supabase view/table sdlt_progress_summary (latest progress_to_goal)
  async function fetchSdltProgress() {
    const today = getLocalDateString();

    const { data } = await supabase
      .from('sdlt_progress_summary')
      .select('progress_to_goal, "End of Month"')
      .lte('End of Month', today)
      .order('End of Month', { ascending: false })
      .limit(1)
      .single();

    if (data) setSdltProgress(data.progress_to_goal);
  }

  // Reads Supabase view/table sdlt_progress_summary (monthly_interest_from_tx history)
  async function fetchInterestHistory() {
    const { data } = await supabase
      .from('sdlt_progress_summary')
      .select('"End of Month", monthly_interest_from_tx')
      .order('End of Month');

    if (data) {
      setInterestData(
        data.map((row) => ({
          date: row['End of Month'],
          interest: row.monthly_interest_from_tx || 0,
        })),
      );
    }
  }

  useEffect(() => {
    fetchSdltProgress();
    fetchInterestHistory();
  }, []);

  return (
    <Card>
      <a href="/sdlt" className="font-semibold hover:underline">
        SDLT
      </a>
      <div className="text-sm mt-2 text-slate-400">Self Directed Long Term</div>
      <div className="flex items-center gap-2 mt-2">
        {sdltProgress !== null && <DonutChart progress={sdltProgress} />}
        {interestData.length > 0 && (
          <div className="flex-1 min-w-0 overflow-visible">
            <InterestChart data={interestData} />
          </div>
        )}
      </div>
    </Card>
  );
}
