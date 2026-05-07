"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

const workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
}

interface PdfReaderProps {
  title: string;
  file: File | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEndSession: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  missingMessage?: string;
}

export function PdfReader({
  title,
  file,
  currentPage,
  totalPages,
  onPageChange,
  onEndSession,
  isFullscreen,
  onToggleFullscreen,
  missingMessage,
}: PdfReaderProps) {
  const [pageWidth, setPageWidth] = useState(320);

  useEffect(() => {
    function update() {
      const gutter = isFullscreen ? 24 : 72;
      const maxWidth = isFullscreen ? 920 : 420;
      setPageWidth(Math.max(260, Math.min(window.innerWidth - gutter, maxWidth)));
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isFullscreen]);

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-40 flex flex-col bg-[linear-gradient(180deg,#0f0d0b_0%,#1a1511_100%)] px-3 pb-4 pt-4"
          : "mt-4 space-y-4 pb-[120px]"
      }
    >
      <div
        className={
          isFullscreen
            ? "flex h-full flex-col overflow-hidden rounded-none bg-transparent p-0 text-white"
            : "panel-card rounded-[34px] p-5"
        }
      >
        <div className={isFullscreen ? "flex items-center justify-between gap-3 px-2 pb-3 pt-4" : ""}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isFullscreen ? "text-white/55" : "text-muted"}`}>PDF Reader</p>
            <h2 className={`font-display mt-2 text-3xl font-semibold tracking-[-0.03em] ${isFullscreen ? "text-white" : "text-ink"}`}>{title}</h2>
          </div>
          <div className={`flex items-center gap-2 ${isFullscreen ? "" : "mt-5"}`}>
            <button
              type="button"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={onToggleFullscreen}
              className={`rounded-full px-4 py-3 text-sm font-bold ${isFullscreen ? "border border-white/15 bg-white/10 text-white" : "secondary-cta text-ink"}`}
            >
              {isFullscreen ? "Exit" : "Fullscreen"}
            </button>
            {isFullscreen ? (
              <button
                type="button"
                onClick={onEndSession}
                className="primary-cta rounded-full px-4 py-3 text-sm font-bold text-white"
              >
                End Session
              </button>
            ) : null}
          </div>
        </div>

        {file ? (
          <div
            className={`relative mt-5 overflow-hidden ${isFullscreen ? "flex-1 rounded-[34px] border border-white/8 bg-[rgba(255,255,255,0.03)] px-2 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" : "rounded-[28px] border border-[rgba(17,17,17,0.06)] bg-[rgba(255,252,248,0.92)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"}`}
          >
            <div
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className="absolute inset-y-0 left-0 z-10 w-[28%] cursor-pointer bg-transparent"
            />
            <div
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className="absolute inset-y-0 right-0 z-10 w-[28%] cursor-pointer bg-transparent"
            />
            <div className="relative z-0 flex h-full items-center justify-center">
              <Document file={file} loading={<div className="p-10 text-center text-sm text-neutral-500">Loading PDF…</div>}>
                <Page pageNumber={currentPage} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </div>
            {isFullscreen ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Previous page"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-3xl font-medium text-white shadow-[0_14px_24px_rgba(0,0,0,0.18)]"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-3xl font-medium text-white shadow-[0_14px_24px_rgba(0,0,0,0.18)]"
                >
                  ›
                </button>
                  </div>
                  <p className="text-sm font-bold text-white/80">
                    Page {currentPage} / {totalPages}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
            <div className={`mt-5 rounded-[24px] p-4 text-sm leading-6 ${isFullscreen ? "bg-white/5 text-white/70" : "bg-[rgba(255,255,255,0.45)] text-muted"}`}>
              {missingMessage ?? "Re-upload this PDF to continue reading."}
            </div>
        )}

        {!isFullscreen ? (
          <>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className="secondary-cta text-ink flex h-12 w-12 items-center justify-center rounded-full text-3xl font-medium"
              >
                ‹
              </button>
              <p className="text-muted text-sm font-bold">
                Page {currentPage} / {totalPages}
              </p>
              <button
                type="button"
                aria-label="Next page"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className="secondary-cta text-ink flex h-12 w-12 items-center justify-center rounded-full text-3xl font-medium"
              >
                ›
              </button>
            </div>

            <button
              type="button"
              onClick={onEndSession}
              className="primary-cta mt-5 w-full rounded-full px-5 py-3.5 text-base font-bold text-white"
            >
              End Session
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
