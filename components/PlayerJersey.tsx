import clsx from 'clsx';

export function PlayerJersey({
  name,
  primary,
  secondary,
  compact = false,
  className,
}: {
  name: string;
  primary: string;
  secondary: string;
  compact?: boolean;
  className?: string;
}) {
  const surname = name.trim().split(/\s+/).at(-1)?.toUpperCase() ?? '';
  const fontSize = surname.length > 10 ? 8 : surname.length > 7 ? 9.5 : 11;

  return (
    <svg
      viewBox="0 0 120 112"
      role="img"
      aria-label={`${name} jersey`}
      className={clsx('drop-shadow-[0_12px_18px_rgba(0,0,0,0.28)]', className)}
    >
      <path
        d="M35 12 48 6h24l13 6 25 14-9 25-17-8v60H36V43l-17 8-9-25 25-14Z"
        fill={primary}
        stroke={secondary}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="m48 7 12 15L72 7" fill={secondary} stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13 27 34 16l5 20-20 12-6-21Zm94 0L86 16l-5 20 20 12 6-21Z" fill={secondary} />
      <path d="M18 42h18M84 42h18" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      {!compact && (
        <>
          <text
            x="60"
            y="57"
            textAnchor="middle"
            fill="#ffffff"
            stroke="rgba(0,0,0,.55)"
            strokeWidth="1.4"
            paintOrder="stroke"
            fontFamily="var(--font-poppins), Arial, sans-serif"
            fontSize={fontSize}
            fontWeight="900"
            letterSpacing=".4"
          >
            {surname}
          </text>
          <path d="M46 64h28" stroke={secondary} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
