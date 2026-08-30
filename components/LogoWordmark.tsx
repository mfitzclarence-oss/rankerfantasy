/**
 * RankerFantasy wordmark: "RANKER" in white, a blue upward "ranking"
 * triangle, "FANTASY" in blue — bold, slightly slanted type. Pure SVG so
 * it's crisp at any size (nav bar, footer, share cards) with no external
 * image asset or license concerns.
 */
export function LogoWordmark({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 464 66"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="RankerFantasy"
    >
      <g fontFamily="var(--font-poppins), Arial, sans-serif" fontWeight={900} letterSpacing="-1.5">
        <g transform="skewX(-6)">
          <text x="0" y="48" fontSize="46" fill="#f5f6f8">
            RANKER
          </text>
        </g>
        <path d="M211 34 L237 34 L224 10 Z" fill="#5c93ff" />
        <g transform="skewX(-6)">
          <text x="249" y="48" fontSize="46" fill="#5c93ff">
            FANTASY
          </text>
        </g>
      </g>
    </svg>
  );
}
