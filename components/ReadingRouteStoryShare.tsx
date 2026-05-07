"use client";

import type { ReactNode } from "react";
import type { ShareCard, ShareVariant } from "@/lib/types";

import { CaffeineIcon } from "@/components/AnimatedBookProgress";
import { HeroBookIllustration } from "@/components/HeroBookIllustration";
import { ReadingRouteProgress } from "@/components/ReadingRouteProgress";

function StatStack({
  label,
  value,
  inlineUnit,
  accentIcon,
}: {
  label: string;
  value: string;
  inlineUnit?: string;
  accentIcon?: ReactNode;
}) {
  return (
    <div className="mb-[72px] flex flex-col items-center text-center last:mb-0">
      <p className="text-[26px] font-bold tracking-[-0.01em] text-white/72">{label}</p>
      <div className="mt-1 flex items-end justify-center gap-3">
        {accentIcon ? <div className="text-[var(--orange)]">{accentIcon}</div> : null}
        <p className="whitespace-nowrap text-[116px] font-black leading-none tracking-[-0.06em] text-white">{value}</p>
        {inlineUnit ? <p className="pb-4 text-[28px] font-bold tracking-[-0.02em] text-white/82">{inlineUnit}</p> : null}
      </div>
    </div>
  );
}

export function ReadingRouteStoryShare({ card, variant = "black" }: { card: ShareCard; variant?: ShareVariant }) {
  return (
    <div className={`flex h-full w-full flex-col items-center overflow-hidden px-16 pb-20 pt-24 text-white ${variant === "black" ? "bg-black" : "bg-transparent"}`}>
      <div className="mb-16 flex w-full justify-center text-[var(--orange)]">
        <HeroBookIllustration className="h-auto w-[210px] max-w-[65%]" />
      </div>
      <p className="text-[20px] font-bold tracking-[-0.01em] text-white/70">READING SESSION</p>
      <h1 className="mt-5 max-w-[920px] text-center text-[82px] font-black leading-[0.96] tracking-[-0.05em] text-balance">{card.bookTitle}</h1>

      <div className="mt-12 flex w-full max-w-[420px] flex-col items-center">
        <StatStack label="Pages" value={`${card.endPage}`} />
        <StatStack label="Pace" value={`${card.pagesPerHour}`} inlineUnit="pages/hr" />
        <StatStack label="Time" value={card.durationShortLabel} />
        <div className="mb-[120px] flex flex-col items-center text-center">
          <p className="text-[26px] font-bold tracking-[-0.01em] text-white/72">Caffeine</p>
          <div className="mt-1 flex items-end justify-center gap-4">
            <CaffeineIcon filled={card.caffeineAmount > 0} className="h-24 w-24 text-[var(--orange)]" />
            <p className="text-[104px] font-black leading-none tracking-[-0.05em] text-white">{card.caffeineAmount}</p>
          </div>
        </div>
      </div>

      <div className="-mt-10 flex h-[420px] w-[980px] max-w-full items-center justify-center">
        <ReadingRouteProgress startPage={card.startPage} endPage={card.endPage} totalPages={card.totalPages} />
      </div>

      <div className="mt-auto pt-3 text-center">
        <p className="text-[40px] font-black tracking-[-0.04em] text-white">{card.endPage} / {card.totalPages} pages</p>
        <p className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-white/54">{Math.round(card.progressAfter)}% completed</p>
      </div>
    </div>
  );
}
