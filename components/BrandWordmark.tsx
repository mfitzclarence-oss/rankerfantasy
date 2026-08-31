import clsx from 'clsx';

type BrandWordmarkProps = {
  className?: string;
  compact?: boolean;
  prefix?: 'Rank' | 'Style';
  descriptor?: string;
};

/**
 * RankUp Fantasy wordmark. The clean typographic lockup deliberately mirrors
 * the OrderUp Fantasy family without relying on a baked-in image background.
 */
export function BrandWordmark({
  className,
  compact = false,
  prefix = 'Rank',
  descriptor = 'Fantasy',
}: BrandWordmarkProps) {
  const label = `${prefix}Up ${descriptor}`;

  return (
    <span
      className={clsx('inline-flex select-none flex-col items-stretch leading-none', className)}
      aria-label={label}
    >
      <span
        className={clsx(
          'brand-wordmark-main whitespace-nowrap tracking-[-0.055em]',
          compact ? 'text-[1.55rem]' : 'text-[2rem] sm:text-[2.35rem]'
        )}
        aria-hidden="true"
      >
        <span className="text-white">{prefix}</span>
        <span className="ml-[0.035em] text-[#2783ff]">
          <span>U</span>
          <span>p</span>
        </span>
      </span>
      <span className="mt-0.5 flex items-center gap-2 px-[0.12em]">
        <span className="h-px flex-1 bg-[#087cff]" />
        <span
          className={clsx(
            'font-sans font-bold uppercase text-white/55',
            compact ? 'text-[0.38rem] tracking-[0.46em]' : 'text-[0.46rem] tracking-[0.58em] sm:text-[0.5rem]'
          )}
        >
          {descriptor}
        </span>
        <span className="h-px flex-1 bg-[#087cff]" />
      </span>
    </span>
  );
}
