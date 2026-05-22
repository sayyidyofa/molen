export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-8 h-8">
        <svg
          viewBox="0 0 32 32"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="16"
            cy="16"
            r="6"
            stroke="url(#gradient1)"
            strokeWidth="1.5"
            fill="none"
            className="animate-pulse"
            style={{ animationDuration: "3s" }}
          />
          <circle cx="16" cy="16" r="2" fill="#6366f1">
            <animate
              attributeName="r"
              values="2;2.5;2"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <line
            x1="16"
            y1="10"
            x2="16"
            y2="4"
            stroke="url(#gradient1)"
            strokeWidth="1.5"
          />
          <line
            x1="16"
            y1="28"
            x2="16"
            y2="22"
            stroke="url(#gradient1)"
            strokeWidth="1.5"
          />
          <line
            x1="22"
            y1="16"
            x2="28"
            y2="16"
            stroke="url(#gradient1)"
            strokeWidth="1.5"
          />
          <line
            x1="4"
            y1="16"
            x2="10"
            y2="16"
            stroke="url(#gradient1)"
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient
              id="gradient1"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-xl opacity-50" />
      </div>
      <span className="text-xl tracking-tight" style={{ fontWeight: 600 }}>
        M<span className="text-accent">o</span>len
      </span>
    </div>
  );
}
