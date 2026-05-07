"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ActivityStatsCard } from "@/components/ActivityStatsCard";
import { ActiveSessionTimer } from "@/components/ActiveSessionTimer";
import { BookForm } from "@/components/BookForm";
import { BottomNav } from "@/components/BottomNav";
import { PdfReader } from "@/components/PdfReader";
import { ReadingShareCard, shareExportMeta } from "@/components/ReadingShareCard";
import { SessionSummary } from "@/components/SessionSummary";
import { demoBooks, demoSessions, demoUser, sampleBook } from "@/lib/mock-data/demo";
import type { Book, ReadingSession, SessionSummaryData, ShareCard, ShareVariant, User } from "@/lib/types";
import { calculateDurationSeconds, calculatePagesRead, createSessionSummary, getAutoStartPage, startSession } from "@/lib/utils/reading";
import { createPdfBookFromUpload, extractPdfMetadata, updatePdfBookProgress } from "@/lib/utils/pdf";
import { loadPdfObjectUrl, savePdfFile } from "@/lib/utils/pdf-storage";
import { downloadShareCard, shareCardImage } from "@/lib/utils/share";
import { buildShareCardFromSession } from "@/lib/utils/share-card";
import { formatDurationFromSeconds } from "@/lib/utils/time";

type Screen = "home" | "setup" | "active" | "reader" | "summary" | "share";
const STORAGE_KEY = "liber-mvp-state-v2";

function formatDurationLabel(startedAt: string, endedAt?: string) {
  if (!endedAt) return "0s";
  const diffSeconds = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  return formatDurationFromSeconds(diffSeconds);
}

export function LiberApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [user, setUser] = useState<User>(demoUser);
  const [books, setBooks] = useState<Book[]>(demoBooks);
  const [sessions, setSessions] = useState<ReadingSession[]>(demoSessions);
  const [activeBookId, setActiveBookId] = useState<string>(demoBooks[0]?.id ?? "");
  const [pendingSession, setPendingSession] = useState<ReadingSession | null>(null);
  const [endValue, setEndValue] = useState("");
  const [note, setNote] = useState("");
  const [caffeineAmount, setCaffeineAmount] = useState("0");
  const [latestSummary, setLatestSummary] = useState<SessionSummaryData | null>(null);
  const [shareCard, setShareCard] = useState<ShareCard | null>(buildShareCardFromSession(demoSessions[0], demoBooks[0]));
  const [shareVariant, setShareVariant] = useState<ShareVariant>("black");
  const [shareFeedback, setShareFeedback] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [pdfReaderUrl, setPdfReaderUrl] = useState<string | null>(null);
  const [pdfReaderMessage, setPdfReaderMessage] = useState("");
  const exportNodeRef = useRef<HTMLDivElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { user: User; books: Book[]; sessions: ReadingSession[] };
      setUser(parsed.user);
      setBooks(parsed.books);
      setSessions(parsed.sessions);
      setActiveBookId(parsed.books[0]?.id ?? "");
      const latestSession = parsed.sessions.find((session) => typeof session.endedAt === "string");
      const latestBook = parsed.books.find((book) => book.id === latestSession?.bookId);
      setShareCard(latestSession && latestBook ? buildShareCardFromSession(latestSession, latestBook) : null);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, books, sessions }));
  }, [user, books, sessions]);

  const activeBook = books.find((book) => book.id === activeBookId) ?? null;
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter((session) => session.endedAt?.slice(0, 10) === todayKey);
  const todayPages = todaySessions.reduce((sum, session) => sum + (session.pagesRead ?? 0), 0);
  const todayMinutes = todaySessions.reduce((sum, session) => sum + (session.durationMinutes ?? 0), 0);
  const shareableSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          typeof session.endedAt === "string" &&
          typeof session.pagesRead === "number" &&
          typeof session.durationMinutes === "number" &&
          typeof session.progressBefore === "number" &&
          typeof session.progressAfter === "number" &&
          typeof session.streakDay === "number",
      ),
    [sessions],
  );

  const previewScale = Math.min(300 / shareExportMeta.width, 534 / shareExportMeta.height);
  const livePagesRead =
    pendingSession && Number.isFinite(Number(endValue)) ? calculatePagesRead(pendingSession.startValue, Number(endValue)) : 0;

  function primaryTab() {
    if (screen === "setup") return "books" as const;
    if (screen === "active" || screen === "summary" || screen === "reader") return "session" as const;
    return screen as "home" | "share";
  }

  function onNav(tab: "home" | "books" | "session" | "share") {
    if (tab === "books") setScreen("setup");
    else if (tab === "session") setScreen("active");
    else setScreen(tab);
  }

  function handleUseSample() {
    setBooks((current) => (current.some((book) => book.id === sampleBook.id) ? current : [sampleBook, ...current]));
    setActiveBookId(sampleBook.id);
    setScreen("home");
  }

  function handleAddBook(payload: Omit<Book, "id" | "currentPage">, startValue: number) {
    if (!payload.title || !payload.author || payload.totalPages <= 0) return;
    const book: Book = {
      id: `book-${Date.now()}`,
      ...payload,
      currentPage: payload.progressUnit === "percent" ? Math.round((startValue / 100) * payload.totalPages) : startValue,
    };
    setBooks((current) => [book, ...current]);
    setActiveBookId(book.id);
    setScreen("active");
  }

  async function handlePdfUpload(file: File) {
    const metadata = await extractPdfMetadata(file);
    const fileId = `pdf-${Date.now()}`;
    await savePdfFile(fileId, file);
    const book = createPdfBookFromUpload({
      fileId,
      metadata,
      fileUrl: URL.createObjectURL(file),
    });
    setBooks((current) => [book, ...current]);
    setActiveBookId(book.id);
    setPdfReaderUrl(book.fileUrl ?? null);
    setScreen("active");
  }

  function beginSessionForBook(book: Book) {
    const startValue = book.progressUnit === "percent" ? Math.round((book.currentPage / book.totalPages) * 100) : getAutoStartPage(book.id, sessions, book.currentPage);
    const session = startSession(book.id, startValue, book.progressUnit);
    session.sourceType = book.sourceType;
    session.startPage = startValue;
    setPendingSession(session);
    setEndValue(String(startValue));
    setNote("");
    setCaffeineAmount("0");
    setSessionError("");

    if (book.sourceType === "pdf") {
      void openPdfReader(book);
    }
  }

  async function openPdfReader(book: Book) {
    setPdfReaderMessage("");
    if (book.fileUrl) {
      setPdfReaderUrl(book.fileUrl);
      setScreen("reader");
      return;
    }

    if (!book.fileId) {
      setPdfReaderMessage("Re-upload this PDF to continue reading.");
      setPdfReaderUrl(null);
      setScreen("reader");
      return;
    }

    const restoredUrl = await loadPdfObjectUrl(book.fileId).catch(() => null);
    if (!restoredUrl) {
      setPdfReaderMessage("Re-upload this PDF to continue reading.");
      setPdfReaderUrl(null);
      setScreen("reader");
      return;
    }

    setPdfReaderUrl(restoredUrl);
    setBooks((current) => current.map((entry) => (entry.id === book.id ? { ...entry, fileUrl: restoredUrl } : entry)));
    setScreen("reader");
  }

  function updateCurrentPdfPage(nextPage: number) {
    if (!activeBook) {
      return;
    }

    setBooks((current) => updatePdfBookProgress(current, activeBook.id, nextPage));
  }

  function finishPdfSession() {
    if (!pendingSession || !activeBook) {
      return;
    }

    const endedAt = new Date();
    const endPage = activeBook.currentPage;
    const summary = createSessionSummary({
      bookTotalPages: activeBook.totalPages,
      startValue: pendingSession.startPage ?? pendingSession.startValue,
      endValue: endPage,
      progressUnit: "page",
      startedAt: pendingSession.startedAt,
      endedAt: endedAt.toISOString(),
      previousStreak: user.streakCount,
      lastSessionDate: user.lastSessionDate,
      caffeineAmount: Number(caffeineAmount) || 0,
    });

    const completed: ReadingSession = {
      ...pendingSession,
      endedAt: endedAt.toISOString(),
      endValue: endPage,
      startPage: pendingSession.startPage ?? pendingSession.startValue,
      endPage,
      note,
      caffeineAmount: Number(caffeineAmount) || 0,
      durationMinutes: summary.minutesRead,
      durationSeconds: calculateDurationSeconds(new Date(pendingSession.startedAt), endedAt),
      pagesRead: summary.pagesRead,
      progressBefore: summary.progressBefore,
      progressAfter: summary.progressAfter,
      streakDay: summary.streakDay,
    };

    setSessions((current) => [completed, ...current]);
    setUser((current) => ({
      ...current,
      streakCount: summary.streakDay,
      totalPagesRead: current.totalPagesRead + summary.pagesRead,
      totalMinutesRead: current.totalMinutesRead + summary.minutesRead,
      lastSessionDate: completed.endedAt,
    }));
    setLatestSummary(summary);
    setShareCard(buildShareCardFromSession(completed, activeBook));
    setPendingSession(null);
    setScreen("summary");
  }

  function finishSession() {
    if (!pendingSession || !activeBook) return;
    const parsedEnd = Number(endValue);
    const parsedCaffeine = Math.min(5, Math.max(0, Number(caffeineAmount) || 0));

    if (!Number.isFinite(parsedEnd) || parsedEnd <= pendingSession.startValue) {
      setSessionError("End page must be greater than your start page.");
      return;
    }

    const endedAt = new Date();
    const summary = createSessionSummary({
      bookTotalPages: activeBook.totalPages,
      startValue: pendingSession.startValue,
      endValue: parsedEnd,
      progressUnit: pendingSession.progressUnit,
      startedAt: pendingSession.startedAt,
      endedAt: endedAt.toISOString(),
      previousStreak: user.streakCount,
      lastSessionDate: user.lastSessionDate,
      caffeineAmount: parsedCaffeine,
    });

    if (summary.pagesRead <= 0) {
      setSessionError("Please enter progress beyond where you started before saving.");
      return;
    }

    const completed: ReadingSession = {
      ...pendingSession,
      endedAt: endedAt.toISOString(),
      endValue: parsedEnd,
      startPage: pendingSession.startPage ?? pendingSession.startValue,
      endPage: parsedEnd,
      note,
      caffeineAmount: parsedCaffeine,
      durationMinutes: summary.minutesRead,
      durationSeconds: calculateDurationSeconds(new Date(pendingSession.startedAt), endedAt),
      pagesRead: summary.pagesRead,
      progressBefore: summary.progressBefore,
      progressAfter: summary.progressAfter,
      streakDay: summary.streakDay,
    };

    setSessions((current) => [completed, ...current]);
    setBooks((current) => current.map((book) => (book.id === activeBook.id ? { ...book, currentPage: parsedEnd } : book)));
    setUser((current) => ({
      ...current,
      streakCount: summary.streakDay,
      totalPagesRead: current.totalPagesRead + summary.pagesRead,
      totalMinutesRead: current.totalMinutesRead + summary.minutesRead,
      lastSessionDate: completed.endedAt,
    }));
    setLatestSummary(summary);
    setShareCard(buildShareCardFromSession(completed, activeBook));
    setPendingSession(null);
    setScreen("summary");
    setSessionError("");
  }

  function openShareForSession(sessionId: string) {
    const session = sessions.find((entry) => entry.id === sessionId);
    const book = books.find((entry) => entry.id === session?.bookId);
    if (!session || !book) return;
    const built = buildShareCardFromSession(session, book);
    if (!built) return;
    setShareCard(built);
    setScreen("share");
  }

  async function handleDownload() {
    if (!shareCard || !exportNodeRef.current) return;
    await downloadShareCard(exportNodeRef.current, {
      width: shareExportMeta.width,
      height: shareExportMeta.height,
      backgroundColor: shareVariant === "black" ? "#000000" : "transparent",
    });
    setShareFeedback("PNG downloaded.");
  }

  async function handleShare() {
    if (!shareCard || !exportNodeRef.current) return;
    const result = await shareCardImage(exportNodeRef.current, {
      title: `Liber | ${shareCard.bookTitle}`,
      text: `I read ${shareCard.pagesRead} pages in ${shareCard.durationShortLabel}.`,
      exportOptions: {
        width: shareExportMeta.width,
        height: shareExportMeta.height,
        backgroundColor: shareVariant === "black" ? "#000000" : "transparent",
      },
    });
    setShareFeedback(result === "shared" ? "Shared successfully." : "File download started instead.");
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-44 pt-5">
      <div className="rounded-[40px] border border-white/70 bg-white/60 p-4 pb-8 shadow-[0_30px_120px_rgba(17,17,17,0.08)] backdrop-blur">
        <section className="rounded-[34px] bg-[linear-gradient(135deg,#f48b57_0%,#f7a26d_58%,#f7c7a7_100%)] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">{screen === "share" ? "Share Card" : screen === "setup" ? "Book Setup" : screen === "active" ? "Reading Session" : screen === "summary" ? "Finish Session" : "Liber"}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-balance">
            {screen === "setup"
              ? "Add a book."
              : screen === "active"
                ? "Track a session."
                : screen === "summary"
                  ? "Save your progress."
                  : screen === "share"
                    ? "Share the session."
                    : "Track your reading."}
          </h1>
        </section>

        {screen !== "share" ? (
          <section className="mt-4 grid grid-cols-3 gap-3">
            <ActivityStatsCard label="Streak" value={`${user.streakCount}`} sublabel="days" />
            <ActivityStatsCard label="Pages" value={`${todayPages}`} sublabel="today" />
            <ActivityStatsCard label="Minutes" value={`${todayMinutes}`} sublabel="today" />
          </section>
        ) : null}

        {screen === "home" ? (
          <section className="mt-4 space-y-4">
            <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
              {activeBook ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Current Book</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">{activeBook.title}</h2>
                  <p className="mt-2 text-sm text-neutral-500">{activeBook.author || "Works with Kindle, physical books, PDFs, and audiobooks."}</p>
                  <button type="button" onClick={() => setScreen(books.length > 0 ? "active" : "setup")} className="mt-5 rounded-full bg-[var(--orange)] px-5 py-3 text-sm font-bold text-white">
                    Start reading
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Library</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">No books yet</h2>
                  <button type="button" onClick={() => setScreen("setup")} className="mt-5 rounded-full bg-[var(--orange)] px-5 py-3 text-sm font-bold text-white">
                    Add a book
                  </button>
                </>
              )}
            </div>
          </section>
        ) : null}

        {screen === "setup" ? (
          <section className="mt-4 space-y-4 pb-4">
            <BookForm initialStartValue={1} onSubmit={handleAddBook} onUseSample={handleUseSample} />
            <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Your books</p>
              <div className="mt-4">
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handlePdfUpload(file);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="rounded-full border border-neutral-200 px-5 py-3 text-sm font-bold text-neutral-900"
                >
                  Upload PDF
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {books.length === 0 ? <div className="rounded-[24px] bg-neutral-50 p-4 text-sm text-neutral-500">No books yet. Add a book first.</div> : null}
                {books.map((book) => (
                  <div key={book.id} className="rounded-[24px] bg-neutral-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-neutral-950">{book.title}</p>
                        <p className="mt-1 text-sm text-neutral-500">{book.author || book.fileName || "Untitled PDF"}</p>
                      </div>
                      <button type="button" onClick={() => setActiveBookId(book.id)} className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${book.id === activeBookId ? "bg-[var(--orange)] text-white" : "bg-white text-[var(--orange)]"}`}>
                        {book.id === activeBookId ? "Selected" : "Select"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {screen === "active" ? (
          <section className="mt-4 space-y-4 pb-6">
            {!activeBook ? (
              <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
                <p className="text-sm text-neutral-500">No books yet. Add a book first.</p>
              </div>
            ) : pendingSession ? (
              <>
                <ActiveSessionTimer startedAt={pendingSession.startedAt} />
                <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Live Read</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">{activeBook.title}</h2>
                  <p className="mt-2 text-sm text-neutral-500">Start page {pendingSession.startValue}</p>
                  {activeBook.sourceType === "pdf" ? (
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => void openPdfReader(activeBook)} className="rounded-full border border-neutral-200 px-5 py-3 text-sm font-bold text-neutral-900">
                        Resume PDF
                      </button>
                      <button type="button" onClick={finishPdfSession} className="rounded-full bg-[var(--orange)] px-5 py-3 text-sm font-bold text-white">
                        End session
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setScreen("summary")} className="mt-5 w-full rounded-full bg-[var(--orange)] px-5 py-3 text-base font-bold text-white">
                      End session
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Session Hub</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">{activeBook.title}</h2>
                  <p className="mt-2 text-sm text-neutral-500">{activeBook.author || activeBook.fileName || "PDF reader ready"}</p>
                  <button type="button" onClick={() => beginSessionForBook(activeBook)} className="mt-5 w-full rounded-full bg-[var(--orange)] px-5 py-3 text-base font-bold text-white">
                    {activeBook.sourceType === "pdf" ? "Read PDF" : "Start session"}
                  </button>
                </div>
                <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Session History</p>
                  <div className="mt-4 space-y-3">
                    {shareableSessions.length === 0 ? <div className="rounded-[24px] bg-neutral-50 p-4 text-sm text-neutral-500">No sessions yet. Start one from the Session tab.</div> : null}
                    {shareableSessions.map((session) => {
                      const book = books.find((entry) => entry.id === session.bookId);
                      return (
                        <div key={session.id} className="rounded-[24px] bg-neutral-50 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-neutral-950">{book?.title ?? "Unknown book"}</p>
                              <p className="mt-1 text-sm text-neutral-500">{session.pagesRead} pages · {session.durationMinutes} min</p>
                              <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">{session.endedAt?.slice(0, 10)}</p>
                            </div>
                            <button type="button" onClick={() => openShareForSession(session.id)} className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--orange)]">
                              Share
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </section>
        ) : null}

        {screen === "reader" && activeBook ? (
          <PdfReader
            title={activeBook.title}
            fileUrl={pdfReaderUrl}
            currentPage={activeBook.currentPage}
            totalPages={activeBook.totalPages}
            onPageChange={updateCurrentPdfPage}
            onEndSession={finishPdfSession}
            missingMessage={pdfReaderMessage}
          />
        ) : null}

        {screen === "summary" ? (
          <section className="mt-4 space-y-4 pb-8">
            {pendingSession && activeBook ? (
              <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">End Session</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">What page did you finish on?</h2>
                <p className="mt-4 text-sm font-bold text-neutral-900">Starting page</p>
                <p className="mt-1 text-xl font-black text-neutral-950">{pendingSession.startValue}</p>
                <div className="mt-4 grid gap-3">
                  <input value={endValue} onChange={(event) => setEndValue(event.target.value)} placeholder="End page" className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-[var(--orange)]" />
                  <div className="rounded-[20px] bg-neutral-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Pages read</p>
                    <p className="mt-2 text-2xl font-black text-neutral-950">{livePagesRead}</p>
                  </div>
                  <label className="grid gap-2 text-sm font-medium text-neutral-700">
                    <span>Caffeine amount</span>
                    <input aria-label="Caffeine amount" min="0" max="5" value={caffeineAmount} onChange={(event) => setCaffeineAmount(event.target.value)} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-[var(--orange)]" />
                  </label>
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note if you want" rows={4} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-[var(--orange)]" />
                </div>
                {sessionError ? <p className="mt-4 text-sm font-medium text-red-600">{sessionError}</p> : null}
                <button type="button" onClick={finishSession} className="mt-5 w-full rounded-full bg-[var(--orange)] px-5 py-3 text-base font-bold text-white">
                  Save session
                </button>
              </div>
            ) : latestSummary && shareCard ? (
              <>
                <SessionSummary summary={latestSummary} note={shareCard.note} />
                <button type="button" onClick={() => setScreen("share")} className="w-full rounded-full bg-[var(--orange)] px-5 py-3 text-base font-bold text-white">
                  Generate Share Card
                </button>
              </>
            ) : null}
          </section>
        ) : null}

        {screen === "share" ? (
          shareCard && shareCard.pagesRead > 0 ? (
            <section className="mt-4 space-y-4 pb-[120px]">
              <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Reading Activity</p>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setShareVariant("black")} className={`rounded-full px-4 py-2 text-sm font-bold ${shareVariant === "black" ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-700"}`}>
                    Black Story
                  </button>
                  <button type="button" onClick={() => setShareVariant("transparent")} className={`rounded-full px-4 py-2 text-sm font-bold ${shareVariant === "transparent" ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-700"}`}>
                    Transparent Overlay
                  </button>
                </div>
                <div
                  className="mt-5 flex justify-center rounded-[28px] p-4"
                  style={{
                    backgroundColor: shareVariant === "transparent" ? "#101010" : "transparent",
                    backgroundImage:
                      shareVariant === "transparent"
                        ? "linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)"
                        : "linear-gradient(45deg, rgba(17,17,17,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(17,17,17,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(17,17,17,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(17,17,17,0.08) 75%)",
                    backgroundSize: "24px 24px",
                    backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
                  }}
                >
                  <div className="relative overflow-hidden rounded-[28px] shadow-[0_18px_50px_rgba(17,17,17,0.10)]" style={{ width: "300px", height: "534px" }}>
                    <div className="absolute left-0 top-0" style={{ width: `${shareExportMeta.width}px`, height: `${shareExportMeta.height}px`, transform: `scale(${previewScale})`, transformOrigin: "top left", pointerEvents: "none" }}>
                      <ReadingShareCard card={shareCard} variant={shareVariant} className="h-full w-full bg-transparent" />
                    </div>
                  </div>
                </div>
                <div data-testid="share-export-node" style={{ position: "fixed", left: "-2000px", top: 0, width: "auto", height: "auto", opacity: 1, pointerEvents: "none", zIndex: -1, background: "transparent" }}>
                  <div ref={exportNodeRef} style={{ width: `${shareExportMeta.width}px`, height: `${shareExportMeta.height}px`, background: "transparent" }}>
                    <ReadingShareCard card={shareCard} variant={shareVariant} className="h-full w-full bg-transparent" />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3">
                  <button type="button" onClick={handleDownload} className="rounded-full border border-neutral-200 px-5 py-3 text-base font-bold text-neutral-900">
                    Download PNG
                  </button>
                  <button type="button" onClick={handleShare} className="rounded-full bg-[var(--orange)] px-5 py-3 text-base font-bold text-white">
                    Share
                  </button>
                  <button type="button" onClick={() => setScreen("home")} className="rounded-full border border-neutral-200 px-5 py-3 text-base font-bold text-neutral-900">
                    Back to Home
                  </button>
                </div>
                {shareFeedback ? <p className="mt-3 text-sm text-neutral-500">{shareFeedback}</p> : null}
              </div>
            </section>
          ) : (
            <section className="mt-4 pb-28">
              <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
                <p className="text-sm text-neutral-500">Complete a valid reading session before sharing.</p>
              </div>
            </section>
          )
        ) : null}
      </div>

      <BottomNav activeTab={primaryTab()} onSelect={onNav} />
    </main>
  );
}
