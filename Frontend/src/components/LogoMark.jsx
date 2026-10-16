export default function LogoMark({ className = "size-9" }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
      <rect width="96" height="96" rx="24" fill="#a5b4fc" />
      <path
        d="M22 64 L38 38 L60 50 L74 24 M60 50 L72 72"
        fill="none"
        stroke="#111426"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="64" r="4" fill="#111426" />
      <circle cx="38" cy="38" r="5" fill="#111426" />
      <circle cx="74" cy="24" r="4" fill="#111426" />
      <circle cx="72" cy="72" r="4" fill="#111426" />
      <circle cx="60" cy="50" r="8" fill="#111426" />
      <circle cx="60" cy="50" r="3" fill="#a5b4fc" />
      <circle cx="30" cy="22" r="2" fill="#111426" />
    </svg>
  );
}