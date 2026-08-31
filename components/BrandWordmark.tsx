import clsx from 'clsx';

type BrandWordmarkProps = {
  className?: string;
  compact?: boolean;
};

/**
 * RankUp Fantasy wordmark. The clean typographic lockup deliberately mirrors
 * the OrderUp Fantasy family without relying on a baked-in image background.
 */
export function BrandWordmark({ className, compact = false }: BrandWordmarkProps) {
  return (
    <span
      className={clsx('inline-flex select-none flex-col items-stretch leading-none', className)}
      aria-label="RankUp Fantasy"
    >
      <span
        className={clsx(
          'brand-wordmark-main whitespace-nowrap tracking-[-0.07em]',
          compact ? 'text-[1.55rem]' : 'text-[2rem] sm:text-[2.35rem]'
        )}
      >
        <span className="text-white">Rank</span>
        <span className="ml-[0.04em] inline-flex items-baseline text-blue">
          <svg
            aria-hidden="true"
            viewBox="0 0 30 36"
            className="mr-[-0.06em] h-[0.92em] w-[0.68em] overflow-visible"
            fill="none"
          >
            <path
              d="M8 4v21c0 9 16 9 16 0V12"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
            <path
              d="m3.5 9 4.5-6 4.5 6"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>p</span>
        </span>
      </span>
      <span className="mt-0.5 flex items-center gap-2 px-[0.12em]">
        <span className="h-px flex-1 bg-blue/80" />
        <span
          className={clsx(
            'font-sans font-bold uppercase text-white/55',
            compact ? 'text-[0.38rem] tracking-[0.46em]' : 'text-[0.46rem] tracking-[0.58em] sm:text-[0.5rem]'
          )}
        >
          Fantasy
        </span>
        <span className="h-px flex-1 bg-blue/80" />
      </span>
    </span>
  );
}
