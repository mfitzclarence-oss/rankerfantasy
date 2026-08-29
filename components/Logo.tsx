/**
 * RankerFantasy logomark: a football silhouette with an upward "ranking"
 * chevron cut through it — reads as both "football" and "climbing the
 * rankings" at a glance. Pure SVG so it's crisp at any size (nav bar,
 * favicon, share cards) with no external image asset or license concerns.
 */
export function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#ff5a1f" />
      <ellipse cx="16" cy="16" rx="9.5" ry="6.5" transform="rotate(-35 16 16)" fill="#07090d" />
      <path d="M10.5 19.5L21.5 12.5" stroke="#ff5a1f" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M12 21L15 15M15.3 17.8L18 16.5M16.6 15L19.3 13.7" stroke="#ff5a1f" strokeWidth="1" strokeLinecap="round" />
      <path
        d="M8 21L13.5 13.5L17 18L24 8"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18.5 8H24V13.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
