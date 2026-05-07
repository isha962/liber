"use client";

import type { ShareCard, ShareVariant } from "@/lib/types";
import { ReadingRouteStoryShare } from "@/components/ReadingRouteStoryShare";

export const shareExportMeta = {
  width: 1080,
  height: 1920,
};

export function ReadingShareCard({
  card,
  className,
  variant = "black",
}: {
  card: ShareCard;
  className?: string;
  animate?: boolean;
  variant?: ShareVariant;
}) {
  return (
    <div className={className ?? "h-full w-full bg-transparent"}>
      <ReadingRouteStoryShare card={card} variant={variant} />
    </div>
  );
}
