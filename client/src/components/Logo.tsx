export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-label="Lift Log logo"
    >
      {/* Stylized dumbbell + spark mark */}
      <rect x="4" y="13" width="3" height="6" rx="1" fill="currentColor" />
      <rect x="25" y="13" width="3" height="6" rx="1" fill="currentColor" />
      <rect x="8" y="14.5" width="2" height="3" rx="0.5" fill="currentColor" />
      <rect x="22" y="14.5" width="2" height="3" rx="0.5" fill="currentColor" />
      <rect x="10.5" y="15" width="11" height="2" rx="0.5" fill="currentColor" />
      <path d="M16 4 L17.5 10 L23 11 L18.5 14 L19.5 20 L16 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.0" />
    </svg>
  );
}
