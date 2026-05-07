import type { SessionSummaryData } from "@/lib/types";

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-neutral-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-neutral-950">{value}</p>
    </div>
  );
}

export function SessionSummary({ summary, note }: { summary: SessionSummaryData; note?: string }) {
  return (
    <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Session Summary</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">Session saved</h2>
        </div>
        <div className="rounded-full bg-[var(--orange-soft)] px-4 py-2 text-sm font-bold text-[var(--orange)]">Day {summary.streakDay}</div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <SummaryMetric label="Pages" value={`${summary.pagesRead}`} />
        <SummaryMetric label="Minutes" value={`${summary.minutesRead}`} />
        <SummaryMetric label="Pace" value={`${summary.pagesPerHour}/hr`} />
        <SummaryMetric label="Progress" value={`${summary.progressBefore}% → ${summary.progressAfter}%`} />
      </div>
      <div className="mt-4 rounded-[24px] border border-neutral-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Caffeine</p>
        <p className="mt-2 text-lg font-bold text-neutral-950">{summary.caffeineAmount}</p>
      </div>
      {note ? (
        <div className="mt-4 rounded-[24px] bg-neutral-950 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Note</p>
          <p className="mt-2 text-sm leading-6 text-white/90">{note}</p>
        </div>
      ) : null}
    </div>
  );
}
