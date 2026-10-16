
export default function VoteHud({ room, votes, you }) {
  if (room.phase !== "converge") return null;

  const budget = room.settings?.voteBudget ?? 5;
  const used = votes.mine.length;
  const remaining = Math.max(0, budget - used);
  const progress = budget > 0 ? Math.min(100, (used / budget) * 100) : 0;

  return (
    <section
      aria-label="Your voting budget"
      className="absolute right-2 top-2 z-10 w-[min(12rem,calc(100%-1rem))] rounded-2xl border border-line bg-surface/95 p-3 shadow-xl shadow-black/15 backdrop-blur-xl sm:right-4 sm:top-4 sm:w-52 sm:p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-faint uppercase">
          Your dots
        </p>
        <span className="rounded-md border border-amber-300/20 bg-amber-300/10 px-1.5 py-1 text-[10px] font-semibold text-amber-200">
          {remaining} left
        </span>
      </div>

      <div
        className="mt-3 flex flex-wrap gap-1.5"
        aria-label={`${used} of ${budget} dots used`}
      >
        {Array.from({ length: budget }, (_, i) => (
          <span
            key={i}
            className={`size-3 rounded-full transition-colors sm:size-3.5 ${
              i < used
                ? "bg-amber-300 shadow-sm shadow-amber-300/20"
                : "border border-line bg-surface-hover"
            }`}
          />
        ))}
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full bg-amber-300 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-2 text-[11px] text-dim">
        {used} of {budget} dots used
      </p>
    </section>
  );
}