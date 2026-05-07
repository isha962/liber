interface ActivityStatsCardProps {
  label: string;
  value: string;
  sublabel: string;
}

export function ActivityStatsCard({ label, value, sublabel }: ActivityStatsCardProps) {
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-neutral-950">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{sublabel}</p>
    </div>
  );
}
