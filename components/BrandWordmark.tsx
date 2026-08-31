import clsx from 'clsx';

type BrandWordmarkProps = {
  className?: string;
  compact?: boolean;
};

/**
 * RankUp Fantasy wordmark. The stacked lockup deliberately mirrors the
 * OrderUp Fantasy family: a strong white name, electric-blue "Up", and a
 * widely tracked Fantasy descriptor beneath it.
 */
export function BrandWordmark({ className, compact = false }: BrandWordmarkProps) {
  return (
    <span
      className={clsx('inline-flex select-none items-center gap-2', className)}
      aria-label="RankUp Fantasy"
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue/35 bg-blue/10 shadow-[0_0_24px_-10px_rgba(95,148,255,0.9)] sm:h-10 sm:w-10">
        <svg aria-hidden="true" viewBox="0 0 32 32" className="h-6 w-6" fill="none">
          <path d="M7 19 16 10l9 9" stroke="#73a4ff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 11v13" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={clsx('font-display font-black uppercase tracking-[-0.055em]', compact ? 'text-xl' : 'text-[1.65rem] sm:text-[2rem]')}>
          <span className="text-white">Rank</span><span className="text-blue">Up</span>
        </span>
        <span className={clsx('font-sans font-bold uppercase text-white/55', compact ? 'text-[0.38rem] tracking-[0.44em]' : 'text-[0.48rem] tracking-[0.52em] sm:text-[0.54rem]')}>
          Fantasy
        </span>
      </span>
    </span>
  );
}
