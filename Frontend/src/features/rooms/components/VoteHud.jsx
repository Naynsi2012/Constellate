export default function VoteHud({ room, votes, you }) {
  if (room.phase !== "converge") return null;

  const budget = room.settings?.voteBudget ?? 5;
  const used = votes.filter((v) => v.userId === you.userId).length;
  const remaining = Math.max(0, budget - used);

  return (
    <div className="absolute right-3 top-3 z-10 rounded-lg border border-white/15 bg-slate-900/85 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1 font-semibold tracking-wide text-slate-300">
        YOUR DOTS
      </p>
      <p
        className="text-base leading-none tracking-widest"
        aria-label={`${used} of ${budget} dots used`}
      >
        {Array.from({ length: budget }).map((_, i) => (
          <span
            key={i}
            className={i < used ? "text-amber-300" : "text-slate-600"}
          >
            ●
          </span>
        ))}
      </p>
      <p className="mt-1 text-slate-400">
        {used} / {budget} used · {remaining} left
      </p>
    </div>
  );
}
