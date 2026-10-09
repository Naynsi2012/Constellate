export default function VoteHud({ room, votes, you }) {
  if (room.phase !== "converge") return null;

  const budget = room.settings?.voteBudget ?? 5;
  const used = votes.mine.length;
  const remaining = Math.max(0, budget - used);

  return (
    <div className="panel absolute right-3 top-3 z-10 px-3 py-2 text-xs backdrop-blur">
      <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-dim uppercase">
        Your dots
      </p>
      <p className="flex gap-1" aria-label={`${used} of ${budget} dots used`}>
        {Array.from({ length: budget }).map((_, i) => (
          <span
            key={i}
            className={`size-2.5 rounded-full transition-colors ${
              i < used ? "bg-amber" : "bg-surface-5"
            }`}
          />
        ))}
      </p>
      <p className="mt-1.5 text-faint">
        {used} of {budget} used. {remaining} left.
      </p>
    </div>
  );
}
