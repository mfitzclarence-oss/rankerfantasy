/**
 * Cross-promo banner linking out to OrderUp Fantasy. Copy here is a
 * reasonable placeholder — swap in real copy (a promo code, a specific
 * pitch) once you know exactly what you want to say.
 */
export function OrderUpPromo() {
  return (
    <a
      href="https://www.orderupfantasy.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="card group flex flex-col items-center gap-4 p-6 text-center transition-colors hover:border-accent/50 sm:flex-row sm:justify-between sm:p-8 sm:text-left"
    >
      <div>
        <span className="pill mb-3">Partner</span>
        <h3 className="font-display text-xl font-bold text-white">
          Can&apos;t agree on draft order? <span className="text-accent-bright">OrderUp Fantasy</span> settles it.
        </h3>
        <p className="mt-1 text-sm text-white/55">
          Play free, no-signup mini-games with your league to decide draft order — then come back here and start voting.
        </p>
      </div>
      <span className="btn-secondary shrink-0 !px-5 !py-2.5 text-sm group-hover:border-accent/60">
        Visit OrderUpFantasy.com →
      </span>
    </a>
  );
}
