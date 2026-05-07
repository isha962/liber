type Tab = "home" | "books" | "session" | "share";

interface BottomNavProps {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onSelect }: BottomNavProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "books", label: "Books" },
    { id: "session", label: "Session" },
    { id: "share", label: "Share" },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[min(380px,calc(100%-24px))] -translate-x-1/2 rounded-full border border-black/5 bg-white/92 p-2 shadow-[0_24px_60px_rgba(17,17,17,0.16)] backdrop-blur">
      <div className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={`rounded-full px-3 py-3 text-sm font-bold ${
              activeTab === tab.id ? "bg-[var(--orange)] text-white" : "text-neutral-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
