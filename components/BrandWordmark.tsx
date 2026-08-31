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
        <span className="relative ml-[0.04em] text-blue">
          Up
          <svg
            aria-hidden="true"
            viewBox="0 0 18 10"
            className="absolute -right-[0.34em] -top-[0.08em] h-[0.34em] w-[0.58em]"
            fill="none"
          >
            <path d="M2 8 9 2l7 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      <span className="mt-1 flex items-center gap-2 px-[0.12em]">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-blue/70" />
        <span
          className={clsx(
            'font-sans font-bold uppercase text-white/60',
            compact ? 'text-[0.38rem] tracking-[0.46em]' : 'text-[0.46rem] tracking-[0.58em] sm:text-[0.5rem]'
          )}
        >
          Fantasy
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-blue/70" />
      </span>
    </span>
  );
}
