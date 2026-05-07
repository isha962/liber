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
import { loadPdfFile, savePdfFile } from "@/lib/utils/pdf-storage";
import { downloadShareCard, shareCardImage } from "@/lib/utils/share";
import { buildShareCardFromSession } from "@/lib/utils/share-card";
import { formatDurationFromSeconds } from "@/lib/utils/time";

type Screen = "home" | "setup" | "active" | "reader" | "summary" | "share";
type Theme = "light" | "dark";
const STORAGE_KEY = "liber-mvp-state-v2";
const THEME_KEY = "liber-theme";

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5M18.7 18.7l-1.5-1.5M6.8 6.8 5.3 5.3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7Z" />
    </svg>
  );
}

function getBookProgressPercent(book: Book) {
  if (book.totalPages <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((book.currentPage / book.totalPages) * 100)));
}

function StepperControl({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="warm-card rounded-[26px] px-4 py-4">
      <p className="text-muted text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          onClick={onDecrease}
          className="secondary-cta text-ink flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold"
        >
          −
        </button>
        <p className="text-ink text-4xl font-black tracking-[-0.04em]">{value}</p>
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          onClick={onIncrease}
          className="secondary-cta text-ink flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}

function formatDurationLabel(startedAt: string, endedAt?: string) {
  if (!endedAt) return "0s";
  const diffSeconds = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  return formatDurationFromSeconds(diffSeconds);
}

export function LiberApp() {
  const [theme, setTheme] = useState<Theme>("light");
  const [screen, setScreen] = useState<Screen>("home");
  const [user, setUser] = useState<User>(demoUser);
  const [books, setBooks] = useState<Book[]>(demoBooks);
  const [sessions, setSessions] = useState<ReadingSession[]>(demoSessions);
  const [activeBookId, setActiveBookId] = useState<string>(demoBooks[0]?.id ?? "");
  const [pendingSession, setPendingSession] = useState<ReadingSession | null>(null);
  const [endValue, setEndValue] = useState("");
  const [caffeineAmount, setCaffeineAmount] = useState("0");
  const [latestSummary, setLatestSummary] = useState<SessionSummaryData | null>(null);
  const [shareCard, setShareCard] = useState<ShareCard | null>(buildShareCardFromSession(demoSessions[0], demoBooks[0]));
  const [shareVariant, setShareVariant] = useState<ShareVariant>("black");
  const [shareFeedback, setShareFeedback] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [pdfReaderFile, setPdfReaderFile] = useState<File | null>(null);
  const [pdfReaderMessage, setPdfReaderMessage] = useState("");
  const [pdfFullscreen, setPdfFullscreen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const exportNodeRef = useRef<HTMLDivElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      return;
    }

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    setTheme(media?.matches ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

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
  const recentSessions = shareableSessions.slice(0, 3);

  const previewScale = Math.min(300 / shareExportMeta.width, 534 / shareExportMeta.height);
  const livePagesRead =
    (pendingSession || editingSessionId) && Number.isFinite(Number(endValue))
      ? calculatePagesRead(
          editingSessionId
            ? sessions.find((session) => session.id === editingSessionId)?.startPage ??
                sessions.find((session) => session.id === editingSessionId)?.startValue ??
                0
            : pendingSession?.startValue ?? 0,
          Number(endValue),
        )
      : 0;
  const editingSession = editingSessionId ? sessions.find((session) => session.id === editingSessionId) ?? null : null;
  const sectionClass = "mt-4 space-y-4 pb-[120px]";
  const themeToggleLabel = theme === "light" ? "Dark" : "Light";

  function primaryTab() {
    if (screen === "setup") return "books" as const;
    if (screen === "active" || screen === "summary" || screen === "reader") return "session" as const;
    return screen as "home" | "share";
  }

  function onNav(tab: "home" | "books" | "session" | "share") {
    setPdfFullscreen(false);
    setEditingSessionId(null);
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
    });
    setBooks((current) => [book, ...current]);
    setActiveBookId(book.id);
    setPdfReaderFile(file);
    setScreen("active");
  }

  function beginSessionForBook(book: Book) {
    const startValue = book.progressUnit === "percent" ? Math.round((book.currentPage / book.totalPages) * 100) : getAutoStartPage(book.id, sessions, book.currentPage);
    const session = startSession(book.id, startValue, book.progressUnit);
    session.sourceType = book.sourceType;
    session.startPage = startValue;
    setPendingSession(session);
    setEditingSessionId(null);
    setEndValue(String(startValue));
    setCaffeineAmount("0");
    setSessionError("");

    if (book.sourceType === "pdf") {
      void openPdfReader(book);
    }
  }

  async function openPdfReader(book: Book) {
    setPdfReaderMessage("");
    if (pdfReaderFile && activeBookId === book.id) {
      setScreen("reader");
      return;
    }

    if (!book.fileId) {
      setPdfReaderMessage("Re-upload this PDF to continue reading.");
      setPdfReaderFile(null);
      setScreen("reader");
      return;
    }

    const restoredFile = await loadPdfFile(book.fileId).catch(() => null);
    if (!restoredFile) {
      setPdfReaderMessage("Re-upload this PDF to continue reading.");
      setPdfReaderFile(null);
      setScreen("reader");
      return;
    }

    setPdfReaderFile(restoredFile);
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
    setPdfFullscreen(false);
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

  function stepPendingEndPage(delta: number) {
    if ((!pendingSession && !editingSession) || !activeBook) return;
    const startPage = editingSession ? (editingSession.startPage ?? editingSession.startValue) : (pendingSession?.startValue ?? 0);
    const current = Number(endValue) || startPage;
    const next = Math.min(activeBook.totalPages, Math.max(startPage, current + delta));
    setEndValue(String(next));
  }

  function stepPendingCaffeine(delta: number) {
    const current = Number(caffeineAmount) || 0;
    const next = Math.min(5, Math.max(0, current + delta));
    setCaffeineAmount(String(next));
  }

  function openSessionWrapUp() {
    if (!pendingSession || !activeBook) return;
    const currentEndPage = activeBook.sourceType === "pdf" ? activeBook.currentPage : pendingSession.startValue;
    setEndValue(String(currentEndPage));
    setScreen("summary");
    setPdfFullscreen(false);
  }

  function openEditSession(sessionId: string) {
    const session = sessions.find((entry) => entry.id === sessionId);
    const book = books.find((entry) => entry.id === session?.bookId);
    if (!session || !book || typeof session.endedAt !== "string") return;
    setActiveBookId(book.id);
    setPendingSession(null);
    setEditingSessionId(session.id);
    setEndValue(String(session.endPage ?? session.endValue ?? session.startPage ?? session.startValue));
    setCaffeineAmount(String(session.caffeineAmount));
    setSessionError("");
    setScreen("summary");
  }

  function saveEditedSession() {
    if (!editingSession || !activeBook || typeof editingSession.endedAt !== "string") return;
    const parsedEnd = Number(endValue);
    const parsedCaffeine = Math.min(5, Math.max(0, Number(caffeineAmount) || 0));
    const startPage = editingSession.startPage ?? editingSession.startValue;
    if (!Number.isFinite(parsedEnd) || parsedEnd < startPage) {
      setSessionError("End page must be at least your start page.");
      return;
    }

    const summary = createSessionSummary({
      bookTotalPages: activeBook.totalPages,
      startValue: startPage,
      endValue: parsedEnd,
      progressUnit: "page",
      startedAt: editingSession.startedAt,
      endedAt: editingSession.endedAt,
      previousStreak: Math.max(0, (editingSession.streakDay ?? 1) - 1),
      lastSessionDate: user.lastSessionDate,
      caffeineAmount: parsedCaffeine,
    });

    const updatedSession: ReadingSession = {
      ...editingSession,
      endValue: parsedEnd,
      endPage: parsedEnd,
      caffeineAmount: parsedCaffeine,
      durationMinutes: summary.minutesRead,
      durationSeconds: calculateDurationSeconds(new Date(editingSession.startedAt), new Date(editingSession.endedAt)),
      pagesRead: summary.pagesRead,
      progressBefore: summary.progressBefore,
      progressAfter: summary.progressAfter,
      streakDay: editingSession.streakDay ?? summary.streakDay,
    };

    const updatedSessions = sessions.map((session) => (session.id === updatedSession.id ? updatedSession : session));
    setSessions(updatedSessions);
    setBooks((current) =>
      current.map((book) => (book.id === activeBook.id ? { ...book, currentPage: updatedSession.endPage ?? book.currentPage } : book)),
    );
    setUser((current) => ({
      ...current,
      totalPagesRead: updatedSessions.reduce((sum, session) => sum + (session.pagesRead ?? 0), 0),
      totalMinutesRead: updatedSessions.reduce((sum, session) => sum + (session.durationMinutes ?? 0), 0),
    }));
    setLatestSummary({
      ...summary,
      streakDay: updatedSession.streakDay ?? summary.streakDay,
    });
    setShareCard(buildShareCardFromSession(updatedSession, activeBook));
    setEditingSessionId(null);
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
      <div className="shell-card paper-texture rounded-[42px] p-4 pb-8">
        <section className="hero-surface rounded-[36px] p-6 text-white shadow-[0_20px_48px_rgba(252,76,2,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/72">{screen === "share" ? "Share Card" : screen === "setup" ? "Book Setup" : screen === "active" ? "Reading Session" : screen === "summary" ? "Finish Session" : "Liber"}</p>
            {screen === "home" ? (
              <button
                type="button"
                aria-label={themeToggleLabel}
                onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
                className="flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-3 py-2 text-xs font-bold text-white shadow-[0_10px_20px_rgba(0,0,0,0.12)]"
              >
                <ThemeIcon theme={theme} />
                {themeToggleLabel}
              </button>
            ) : null}
          </div>
          <h1 className="font-display mt-3 text-[42px] font-semibold tracking-[-0.04em] text-balance">
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
          {screen === "home" ? <p className="mt-3 max-w-[260px] text-sm leading-6 text-white/82">Turn every session into momentum.</p> : null}
        </section>

        {screen === "home" ? (
          <section className="mt-4 grid grid-cols-3 gap-3">
            <ActivityStatsCard label="Streak" value={`${user.streakCount}`} sublabel="days" />
            <ActivityStatsCard label="Pages" value={`${todayPages}`} sublabel="today" />
            <ActivityStatsCard label="Minutes" value={`${todayMinutes}`} sublabel="today" />
          </section>
        ) : null}

        {screen === "home" ? (
          <section className={sectionClass}>
            <div className="warm-card rounded-[34px] p-6">
              {activeBook ? (
                <>
                  <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">Current Book</p>
                  <h2 className="text-ink font-display mt-2 text-3xl font-semibold tracking-[-0.03em]">{activeBook.title}</h2>
                  <p className="text-muted mt-2 text-sm">{activeBook.author || "Works with Kindle, physical books, PDFs, and audiobooks."}</p>
                  <div className="mt-5">
                    <div className="text-muted flex items-center justify-between text-sm font-semibold">
                      <span>{activeBook.currentPage} / {activeBook.totalPages} pages</span>
                      <span>{getBookProgressPercent(activeBook)}%</span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/75">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,#fc4c02_0%,#ff9b58_100%)]" style={{ width: `${getBookProgressPercent(activeBook)}%` }} />
                    </div>
                  </div>
                  <button type="button" onClick={() => setScreen(books.length > 0 ? "active" : "setup")} className="primary-cta mt-6 rounded-full px-5 py-3.5 text-sm font-bold text-white">
                    Start reading
                  </button>
                </>
              ) : (
                <>
                  <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">Library</p>
                  <h2 className="text-ink font-display mt-2 text-3xl font-semibold tracking-[-0.03em]">No books yet</h2>
                  <p className="text-muted mt-2 text-sm">Start your library with a physical book, Kindle progress, or a PDF upload.</p>
                  <button type="button" onClick={() => setScreen("setup")} className="primary-cta mt-5 rounded-full px-5 py-3.5 text-sm font-bold text-white">
                    Add a book
                  </button>
                </>
              )}
            </div>
            <div className="panel-card rounded-[34px] p-5">
              <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">Recent Activity</p>
              {shareableSessions[0] ? (
                <>
                  <p className="text-ink mt-3 text-sm font-bold">
                    {books.find((book) => book.id === shareableSessions[0]?.bookId)?.title ?? "Recent session"}
                  </p>
                  <p className="text-muted mt-1 text-sm">
                    {shareableSessions[0].pagesRead} pages · {formatDurationLabel(shareableSessions[0].startedAt, shareableSessions[0].endedAt)}
                  </p>
                </>
              ) : (
                <p className="text-muted mt-3 text-sm">No sessions yet. Start one from the Session tab.</p>
              )}
            </div>
          </section>
        ) : null}

        {screen === "setup" ? (
          <section className={sectionClass}>
            <div className="panel-card rounded-[34px] p-5">
              <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">My Books</p>
              <div className="mt-4 space-y-3">
                {books.length === 0 ? (
                  <div className="warm-card text-muted rounded-[26px] p-5 text-sm leading-6">
                    No books yet. Add your first book or upload a PDF below.
                  </div>
                ) : null}
                {books.map((book) => (
                  <div key={book.id} className="warm-card rounded-[28px] px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-ink font-display text-xl font-semibold tracking-[-0.02em]">{book.title}</p>
                        <p className="text-muted mt-1 text-sm">{book.author || book.fileName || "Untitled PDF"} · {book.sourceType === "pdf" ? "PDF" : book.format}</p>
                        <div className="text-muted mt-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em]">
                          <span>{book.currentPage} / {book.totalPages}</span>
                          <span>{getBookProgressPercent(book)}%</span>
                        </div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/75">
                          <div className="h-full rounded-full bg-[linear-gradient(90deg,#fc4c02_0%,#ff9b58_100%)]" style={{ width: `${getBookProgressPercent(book)}%` }} />
                        </div>
                      </div>
                      <button type="button" onClick={() => setActiveBookId(book.id)} className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${book.id === activeBookId ? "primary-cta text-white" : "secondary-cta text-[var(--orange)]"}`}>
                        {book.id === activeBookId ? "Selected" : "Select"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel-card rounded-[34px] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">Add a Book</p>
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
                  className="secondary-cta text-ink rounded-full px-5 py-3 text-sm font-bold"
                >
                  Upload PDF
                </button>
              </div>
              <div className="warm-card text-muted mt-4 rounded-[28px] border border-dashed border-[rgba(252,76,2,0.18)] p-4 text-sm">
                Upload a downloaded PDF to read inside Liber and track progress automatically page by page.
              </div>
              <div className="mt-5">
                <BookForm initialStartValue={1} onSubmit={handleAddBook} onUseSample={handleUseSample} />
              </div>
            </div>
          </section>
        ) : null}

        {screen === "active" ? (
          <section className={sectionClass}>
            {!activeBook ? (
              <div className="panel-card rounded-[34px] p-5">
                <p className="text-muted text-sm">No books yet. Add a book first.</p>
              </div>
            ) : pendingSession ? (
              <>
                <ActiveSessionTimer startedAt={pendingSession.startedAt} />
                <div className="panel-card rounded-[34px] p-5">
                  <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">Live Read</p>
                  <h2 className="text-ink font-display mt-2 text-3xl font-semibold tracking-[-0.03em]">{activeBook.title}</h2>
                  <p className="text-muted mt-2 text-sm">Start page {pendingSession.startValue}</p>
                  {activeBook.sourceType === "pdf" ? (
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => void openPdfReader(activeBook)} className="secondary-cta text-ink rounded-full px-5 py-3 text-sm font-bold">
                        Resume PDF
                      </button>
                      <button type="button" onClick={openSessionWrapUp} className="primary-cta rounded-full px-5 py-3 text-sm font-bold text-white">
                        End session
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={openSessionWrapUp} className="primary-cta mt-5 w-full rounded-full px-5 py-3.5 text-base font-bold text-white">
                      End session
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="warm-card rounded-[34px] p-5">
                  <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">Session Hub</p>
                  <h2 className="text-ink font-display mt-2 text-3xl font-semibold tracking-[-0.03em]">{activeBook.title}</h2>
                  <p className="text-muted mt-2 text-sm">{activeBook.author || activeBook.fileName || "PDF reader ready"}</p>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/75">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#fc4c02_0%,#ff9b58_100%)]" style={{ width: `${getBookProgressPercent(activeBook)}%` }} />
                  </div>
                  <button type="button" onClick={() => beginSessionForBook(activeBook)} className="primary-cta mt-6 w-full rounded-full px-5 py-3.5 text-base font-bold text-white">
                    {activeBook.sourceType === "pdf" ? "Read PDF" : "Start session"}
                  </button>
                </div>
                <div className="panel-card rounded-[34px] p-5">
                  <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">Session History</p>
                  {shareableSessions.length > 3 ? <p className="text-muted mt-2 text-xs">Showing latest 3 sessions.</p> : null}
                  <div className="mt-4 space-y-3">
                    {shareableSessions.length === 0 ? <div className="warm-card text-muted rounded-[24px] p-4 text-sm">No sessions yet. Start one from the Session tab.</div> : null}
                    {recentSessions.map((session) => {
                      const book = books.find((entry) => entry.id === session.bookId);
                      return (
                        <div key={session.id} className="warm-card rounded-[26px] p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-ink text-sm font-bold">{book?.title ?? "Unknown book"}</p>
                              <p className="text-muted mt-1 text-sm">{session.pagesRead} pages · {session.durationMinutes} min</p>
                              <p className="text-soft mt-1 text-xs font-medium uppercase tracking-[0.18em]">{session.endedAt?.slice(0, 10)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => openEditSession(session.id)} className="secondary-cta text-ink rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]">
                                Edit
                              </button>
                              <button type="button" onClick={() => openShareForSession(session.id)} className="secondary-cta rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--orange)]">
                                Share
                              </button>
                            </div>
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
            file={pdfReaderFile}
            currentPage={activeBook.currentPage}
            totalPages={activeBook.totalPages}
            onPageChange={updateCurrentPdfPage}
            onEndSession={openSessionWrapUp}
            isFullscreen={pdfFullscreen}
            onToggleFullscreen={() => setPdfFullscreen((current) => !current)}
            missingMessage={pdfReaderMessage}
          />
        ) : null}

        {screen === "summary" ? (
          <section className="mt-4 space-y-4 pb-[140px]">
            {(pendingSession || editingSession) && activeBook ? (
              <div className="panel-card rounded-[34px] p-5">
                <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">{editingSession ? "Edit Session" : "End Session"}</p>
                <h2 className="text-ink font-display mt-2 text-3xl font-semibold tracking-[-0.03em]">What page did you finish on?</h2>
                <p className="text-ink mt-4 text-sm font-bold">Starting page</p>
                <p className="text-ink mt-1 text-xl font-black">{editingSession ? (editingSession.startPage ?? editingSession.startValue) : pendingSession?.startValue}</p>
                <div className="mt-4 grid gap-3">
                  <StepperControl
                    label="End page"
                    value={Number(endValue) || editingSession?.endPage || pendingSession?.startValue || 0}
                    onDecrease={() => stepPendingEndPage(-1)}
                    onIncrease={() => stepPendingEndPage(1)}
                  />
                  <div className="warm-card rounded-[20px] px-4 py-3">
                    <p className="text-muted text-xs font-semibold uppercase tracking-[0.18em]">Pages read</p>
                    <p className="text-ink mt-2 text-2xl font-black">{livePagesRead}</p>
                  </div>
                  <StepperControl
                    label="Caffeine"
                    value={Number(caffeineAmount) || 0}
                    onDecrease={() => stepPendingCaffeine(-1)}
                    onIncrease={() => stepPendingCaffeine(1)}
                  />
                </div>
                {sessionError ? <p className="mt-4 text-sm font-medium text-red-600">{sessionError}</p> : null}
                <button type="button" onClick={editingSession ? saveEditedSession : finishSession} className="primary-cta mt-5 w-full rounded-full px-5 py-3.5 text-base font-bold text-white">
                  {editingSession ? "Update session" : "Save session"}
                </button>
              </div>
            ) : latestSummary && shareCard ? (
              <>
                <SessionSummary summary={latestSummary} />
                <button type="button" onClick={() => setScreen("share")} className="primary-cta w-full rounded-full px-5 py-3.5 text-base font-bold text-white">
                  Generate Share Card
                </button>
              </>
            ) : null}
          </section>
        ) : null}

        {screen === "share" ? (
          shareCard && shareCard.pagesRead > 0 ? (
            <section className="mt-4 space-y-4 pb-[120px]">
              <div className="panel-card rounded-[34px] p-5">
                <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">Reading Activity</p>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setShareVariant("black")} className={`rounded-full px-4 py-2.5 text-sm font-bold ${shareVariant === "black" ? "bg-neutral-950 text-white shadow-[0_12px_28px_rgba(17,17,17,0.16)]" : "secondary-cta text-ink"}`}>
                    Black Story
                  </button>
                  <button type="button" onClick={() => setShareVariant("transparent")} className={`rounded-full px-4 py-2.5 text-sm font-bold ${shareVariant === "transparent" ? "bg-neutral-950 text-white shadow-[0_12px_28px_rgba(17,17,17,0.16)]" : "secondary-cta text-ink"}`}>
                    Transparent Overlay
                  </button>
                </div>
                <div
                  className="mt-5 flex justify-center rounded-[30px] border border-[rgba(17,17,17,0.06)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
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
                  <div className="relative overflow-hidden rounded-[32px] shadow-[0_24px_60px_rgba(17,17,17,0.14)]" style={{ width: "300px", height: "534px" }}>
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
                  <button type="button" onClick={handleDownload} className="secondary-cta text-ink rounded-full px-5 py-3.5 text-base font-bold">
                    Download PNG
                  </button>
                  <button type="button" onClick={handleShare} className="primary-cta rounded-full px-5 py-3.5 text-base font-bold text-white">
                    Share
                  </button>
                </div>
                {shareFeedback ? <p className="text-muted mt-3 text-sm">{shareFeedback}</p> : null}
              </div>
            </section>
          ) : (
            <section className="mt-4 pb-28">
              <div className="panel-card rounded-[34px] p-5">
                <p className="text-muted text-sm">Complete a valid reading session before sharing.</p>
              </div>
            </section>
          )
        ) : null}
      </div>

      {!pdfFullscreen ? <BottomNav activeTab={primaryTab()} onSelect={onNav} /> : null}
    </main>
  );
}
