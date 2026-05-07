interface ActivityStatsCardProps {
  label: string;
  value: string;
  sublabel: string;
}

export function ActivityStatsCard({ label, value, sublabel }: ActivityStatsCardProps) {
  return (
    <div className="metric-shimmer rounded-[28px] border border-white/80 bg-white/88 p-4 shadow-[0_18px_42px_rgba(83,50,24,0.08)] backdrop-blur">
      <p className="text-muted text-[11px] font-semibold uppercase tracking-[0.2em]">{label}</p>
      <p className="text-ink mt-3 text-3xl font-black tracking-[-0.04em]">{value}</p>
      <p className="text-muted mt-1 text-xs font-medium">{sublabel}</p>
    </div>
  );
}
