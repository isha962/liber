import type { ReactNode } from "react";

type Tab = "home" | "books" | "session" | "share";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.8V20h13V9.8" />
    </svg>
  );
}

function BooksIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4.5h9.5a3 3 0 0 1 3 3V19H8a3 3 0 0 0-3 3Z" />
      <path d="M5 4.5V19a3 3 0 0 1 3-3h9.5" />
    </svg>
  );
}

function SessionIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.5 2" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V5" />
      <path d="m7.5 9.5 4.5-4.5 4.5 4.5" />
      <path d="M5 15.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.5" />
    </svg>
  );
}

interface BottomNavProps {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onSelect }: BottomNavProps) {
  const tabs: { id: Tab; label: string; icon: () => ReactNode }[] = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "books", label: "Books", icon: BooksIcon },
    { id: "session", label: "Session", icon: SessionIcon },
    { id: "share", label: "Share", icon: ShareIcon },
  ];

  return (
    <nav className="fixed bottom-5 left-1/2 z-50 w-[min(390px,calc(100%-24px))] -translate-x-1/2 rounded-[32px] border p-2.5 shadow-[0_28px_70px_rgba(57,35,18,0.18)] backdrop-blur-xl" style={{ background: "var(--nav-bg)", borderColor: "var(--nav-border)" }}>
      <div className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 rounded-[24px] px-2 py-3 text-[11px] font-semibold ${
              activeTab === tab.id
                ? "bg-[var(--orange)] text-white shadow-[0_12px_28px_rgba(252,76,2,0.28)]"
                : "text-muted hover:bg-white/10"
            }`}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
