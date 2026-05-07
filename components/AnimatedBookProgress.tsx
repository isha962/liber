export function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 72" className={className} aria-hidden="true" fill="none">
      <path
        d="M10 18C22 10 34 10 48 22C62 10 74 10 86 18V56C74 48 62 48 48 60C34 48 22 48 10 56V18Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5.8"
      />
      <path d="M48 22V60" stroke="currentColor" strokeLinecap="round" strokeWidth="5.8" />
      <path d="M18 24C27 19 36 20 44 26" stroke="currentColor" strokeLinecap="round" strokeWidth="5.2" />
      <path d="M78 24C69 19 60 20 52 26" stroke="currentColor" strokeLinecap="round" strokeWidth="5.2" />
    </svg>
  );
}

export function CaffeineIcon({ filled = true, className }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <path
        d="M10 14H31V26C31 32.0751 26.0751 37 20 37H18C13.5817 37 10 33.4183 10 29V14Z"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? "0.28" : undefined}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.8"
      />
      <path
        d="M31 17H36C39.3137 17 42 19.6863 42 23C42 26.3137 39.3137 29 36 29H31"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.8"
      />
    </svg>
  );
}
