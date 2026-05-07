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
    <div className="rounded-[32px] bg-neutral-950 p-5 text-white shadow-[0_18px_50px_rgba(17,17,17,0.14)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Active Session</p>
      <p className="mt-2 text-4xl font-black tracking-tight">{value}</p>
    </div>
  );
}
