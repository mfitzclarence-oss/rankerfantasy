/**
 * RankUp Fantasy logomark: a clean upward arrow in the shared blue palette.
 */
export function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#0e1624" />
      <path d="M7 19L16 10L25 19" stroke="#73a4ff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 11V24" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}
