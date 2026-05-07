import type { SessionSummaryData } from "@/lib/types";

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-[rgba(255,255,255,0.45)] p-4">
      <p className="text-muted text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
      <p className="text-ink mt-2 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

export function SessionSummary({ summary }: { summary: SessionSummaryData }) {
  return (
    <div className="panel-card rounded-[34px] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">Session Summary</p>
          <h2 className="text-ink font-display mt-2 text-3xl font-semibold tracking-[-0.03em]">Session saved</h2>
        </div>
        <div className="rounded-full bg-[var(--orange-soft)] px-4 py-2 text-sm font-bold text-[var(--orange)] shadow-[0_10px_24px_rgba(252,76,2,0.12)]">Day {summary.streakDay}</div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <SummaryMetric label="Pages" value={`${summary.pagesRead}`} />
        <SummaryMetric label="Minutes" value={`${summary.minutesRead}`} />
        <SummaryMetric label="Pace" value={`${summary.pagesPerHour}/hr`} />
        <SummaryMetric label="Progress" value={`${summary.progressBefore}% → ${summary.progressAfter}%`} />
      </div>
      <div className="mt-4 rounded-[28px] border border-[rgba(17,17,17,0.08)] bg-[rgba(255,252,248,0.92)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <p className="text-muted text-xs font-semibold uppercase tracking-[0.2em]">Caffeine</p>
        <p className="text-ink mt-3 text-3xl font-black tracking-tight">{summary.caffeineAmount}</p>
      </div>
    </div>
  );
}
