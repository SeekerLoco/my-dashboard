// Start/End date pickers used to filter a date window on sub-pages.

type DateRangeFilterProps = {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
};

export default function DateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex gap-3 mb-6 items-center text-sm">
      <label>
        Start
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="ml-2 bg-white/5 border border-white/10 rounded px-2 py-1"
        />
      </label>
      <label>
        End
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="ml-2 bg-white/5 border border-white/10 rounded px-2 py-1"
        />
      </label>
    </div>
  );
}
