"use client";

import { useEffect, useState } from "react";

function formatTimer(startedAt: string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function ActiveSessionTimer({ startedAt }: { startedAt: string }) {
  const [value, setValue] = useState(() => formatTimer(startedAt));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setValue(formatTimer(startedAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt]);

  return (
    <div className="rounded-[34px] bg-[linear-gradient(145deg,#111111_0%,#1e1a16_100%)] p-6 text-white shadow-[0_24px_60px_rgba(17,17,17,0.18)] ring-1 ring-white/8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Active Session</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-5xl font-black tracking-[-0.06em]">{value}</p>
        <div className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">
          Live
        </div>
      </div>
    </div>
  );
}
