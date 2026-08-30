/**
 * RankerFantasy wordmark: "RANKER" in white, a two-tone rank/sort triangle
 * (blue pointing up, light pointing down), "FANTASY" in blue — set in a
 * heavy condensed display face, upright, tight tracking. Pure SVG so it's
 * crisp at any size (nav bar, footer, share cards) with no external image
 * asset or license concerns.
 */
export function LogoWordmark({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1216 130"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="RankerFantasy"
    >
      <g fontFamily="var(--font-archivo-black), Arial, sans-serif" fontWeight={400} letterSpacing="-2">
        <text x="0" y="118" fontSize="130" fill="#f5f6f8">
          RANKER
        </text>
        <text x="634" y="118" fontSize="130" fill="#5c93ff">
          FANTASY
        </text>
      </g>
      <path d="M584 4 L619 82 L549 82 Z" fill="#5c93ff" />
      <path d="M584 118 L549 70 L619 70 Z" fill="#f5f6f8" opacity="0.92" />
    </svg>
  );
}
