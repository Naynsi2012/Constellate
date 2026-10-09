import { useEffect, useState } from "react";
import { PHASES, PHASE_LABELS } from "../socket/events";

function useTimerDisplay(timer) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!timer?.running) return;
    const id = setInterval(() => tick((v) => v + 1), 500);
    return () => clearInterval(id);
  }, [timer?.running]);

  if (!timer) return null;
  const remaining =
    timer.running && timer.endsAt
      ? Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000))
      : timer.remaining;
  return `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
}

function ClockIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function PhaseBar({ room, you, session }) {
  const phase = room.phase;
  const index = PHASES.indexOf(phase);
  const timerDisplay = useTimerDisplay(room.settings?.timer);
  const [showBudget, setShowBudget] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [minutes, setMinutes] = useState(10);

  const next = PHASES[index + 1];
  const prev = PHASES[index - 1];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-surface-1 px-3 py-2 text-xs backdrop-blur sm:px-4">
      {/* stepper: numbers only on mobile, full labels on sm+ */}
      <ol className="flex min-w-0 items-center gap-1 overflow-x-auto">
        {PHASES.map((p, i) => {
          const state = i < index ? "done" : i === index ? "active" : "todo";
          return (
            <li key={p} className="flex shrink-0 items-center gap-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                  state === "active"
                    ? "border-accent/50 bg-accent-soft text-accent"
                    : state === "done"
                      ? "border-green/25 bg-green/10 text-green"
                      : "border-line bg-surface-3 text-faint"
                }`}
              >
                <span
                  className={`grid size-3.5 place-items-center rounded-full text-[9px] ${
                    state === "done"
                      ? "bg-green/25 text-green"
                      : state === "active"
                        ? "bg-accent/25 text-accent"
                        : "bg-surface-4 text-faint"
                  }`}
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">
                  {PHASE_LABELS[p].toUpperCase()}
                </span>
              </span>
              {i < PHASES.length - 1 && (
                <span
                  className={`h-px w-2 ${i < index ? "bg-green/40" : "bg-line"}`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {timerDisplay && (
        <span
          className={`chip font-mono tabular-nums ${
            room.settings.timer.running
              ? "border-amber/30! bg-amber/10! text-amber!"
              : ""
          }`}
          title="Session timer"
        >
          <ClockIcon />
          {timerDisplay}
        </span>
      )}

      {you.isHost && (
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {prev && (
            <button
              type="button"
              onClick={() => session.setPhase(prev)}
              className="btn-ghost px-2.5! py-1! text-xs!"
            >
              Back
            </button>
          )}
          {next && (
            <button
              type="button"
              onClick={() => session.setPhase(next)}
              title="Ctrl/Cmd + Enter"
              className="btn-primary px-2.5! py-1! text-xs!"
            >
              {PHASE_LABELS[next]}
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowBudget((v) => !v);
                setShowTimer(false);
              }}
              className="btn-ghost px-2.5! py-1! text-xs!"
              title="Vote dots per person"
            >
              Dots {"\u00D7"}{room.settings?.voteBudget ?? 5}
            </button>
            {showBudget && (
              <div className="panel absolute left-0 top-9 z-30 flex items-center gap-2 p-3">
                <span className="text-xs text-dim">Dots per person</span>
                <input
                  type="number"
                  min={1}
                  max={25}
                  defaultValue={room.settings?.voteBudget ?? 5}
                  autoFocus
                  className="input w-16! px-2! py-1! text-xs!"
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                      session.setVoteBudget(Number(e.currentTarget.value));
                      setShowBudget(false);
                    }
                  }}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isInteger(v) && v >= 1 && v <= 25)
                      session.setVoteBudget(v);
                    setShowBudget(false);
                  }}
                />
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTimer((v) => !v);
                setShowBudget(false);
              }}
              className="btn-ghost px-2.5! py-1! text-xs!"
            >
              Timer
            </button>
            {showTimer && (
              <div className="panel absolute right-0 top-9 z-30 flex w-44 flex-col gap-3 p-3">
                <label className="flex items-center justify-between gap-2 text-xs text-dim">
                  Minutes
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="input w-16! px-2! py-1! text-xs!"
                  />
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className="btn-primary flex-1 px-2! py-1! text-xs!"
                    onClick={() => {
                      session.timerStart(Math.round(minutes * 60));
                      setShowTimer(false);
                    }}
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2! py-1! text-xs!"
                    onClick={() => {
                      session.timerPause();
                      setShowTimer(false);
                    }}
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2! py-1! text-xs!"
                    onClick={() => {
                      session.timerReset();
                      setShowTimer(false);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
