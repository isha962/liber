export function HeroBookIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 240" className={className} aria-hidden="true" fill="none">
      <defs>
        <filter id="hero-book-glow" x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      <g opacity="0.16" filter="url(#hero-book-glow)">
        <path
          d="M58 50C68 40 84 38 102 42C114 60 122 74 130 92C132 132 132 166 132 206C120 198 106 188 84 174C74 168 66 162 61 154C60 120 59 86 58 50Z"
          stroke="#FC4C02"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M202 50C192 40 176 38 158 42C146 60 138 74 130 92C128 132 128 166 128 206C140 198 154 188 176 174C186 168 194 162 199 154C200 120 201 86 202 50Z"
          stroke="#FC4C02"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <g stroke="#FC4C02" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M62 54C70 45 84 42 100 45C112 61 121 75 129 93C131 132 131 167 131 208C120 199 106 188 84 175C74 169 67 163 63 155C63 122 62 89 62 54Z" />
        <path d="M198 54C190 45 176 42 160 45C148 61 139 75 131 93C129 132 129 167 129 208C140 199 154 188 176 175C186 169 193 163 197 155C197 122 198 89 198 54Z" />

        <path d="M62 54C68 50 77 48 86 49" />
        <path d="M198 54C192 50 183 48 174 49" />

        <path d="M86 49C96 61 105 74 112 89" />
        <path d="M95 45C105 58 114 72 121 87" />
        <path d="M104 45C113 57 121 70 127 84" />
        <path d="M174 49C164 61 155 74 148 89" />
        <path d="M165 45C155 58 146 72 139 87" />
        <path d="M156 45C147 57 139 70 133 84" />

        <path d="M75 166C70 138 68 108 67 63" />
        <path d="M185 166C190 138 192 108 193 63" />

        <path d="M129 93C127 140 127 177 128 214" />
        <path d="M131 93C133 140 133 177 132 214" />
        <path d="M130 88C130 136 130 176 130 214" />

        <path d="M84 175C96 184 108 193 119 202" />
        <path d="M176 175C164 184 152 193 141 202" />
        <path d="M119 202C123 206 126 211 130 214" />
        <path d="M141 202C137 206 134 211 130 214" />
        <path d="M119 202C123 204 126 205 130 205C134 205 137 204 141 202" />
      </g>
    </svg>
  );
}
