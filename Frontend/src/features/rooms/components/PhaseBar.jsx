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
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// The Diverge → Cluster → Converge pipeline with host controls.
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 bg-slate-900/60 px-4 py-1.5 text-xs">
      <ol className="flex items-center gap-1">
        {PHASES.map((p, i) => (
          <li key={p} className="flex items-center gap-1">
            <span
              className={`rounded-full px-2.5 py-0.5 font-semibold tracking-wide ${
                i === index
                  ? "bg-indigo-500/30 text-indigo-200 ring-1 ring-indigo-400/50"
                  : i < index
                    ? "text-emerald-300/80"
                    : "text-slate-500"
              }`}
            >
              {PHASE_LABELS[p].toUpperCase()}
            </span>
            {i < PHASES.length - 1 && <span className="text-slate-600">→</span>}
          </li>
        ))}
      </ol>

      {timerDisplay && (
        <span
          className={`rounded px-2 py-0.5 font-mono ${
            room.settings.timer.running
              ? "bg-amber-400/15 text-amber-300"
              : "bg-white/10 text-slate-300"
          }`}
          title="Session timer"
        >
          ⏱ {timerDisplay}
        </span>
      )}

      {you.isHost && (
        <div className="flex items-center gap-1.5">
          {prev && (
            <button
              type="button"
              onClick={() => session.setPhase(prev)}
              className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
            >
              ‹ Back
            </button>
          )}
          {next && (
            <button
              type="button"
              onClick={() => session.setPhase(next)}
              title="Ctrl/Cmd + Enter"
              className="rounded bg-indigo-500 px-2 py-0.5 font-semibold text-white hover:bg-indigo-400"
            >
              {PHASE_LABELS[next]} ›
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowBudget((v) => !v);
                setShowTimer(false);
              }}
              className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
              title="Vote dots per person"
            >
              ● ×{room.settings?.voteBudget ?? 5}
            </button>
            {showBudget && (
              <div className="absolute left-0 top-7 z-30 flex items-center gap-2 rounded-lg border border-white/15 bg-slate-900 p-2 shadow-xl">
                <span className="text-slate-300">Dots per person</span>
                <input
                  type="number"
                  min={1}
                  max={25}
                  defaultValue={room.settings?.voteBudget ?? 5}
                  className="w-14 rounded bg-white/10 px-1.5 py-0.5 text-slate-100"
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
              className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
            >
              Timer
            </button>
            {showTimer && (
              <div className="absolute left-0 top-7 z-30 flex flex-col gap-2 rounded-lg border border-white/15 bg-slate-900 p-2 shadow-xl">
                <label className="flex items-center gap-2 text-slate-300">
                  Minutes
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-14 rounded bg-white/10 px-1.5 py-0.5 text-slate-100"
                  />
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded bg-emerald-600 px-2 py-0.5 text-white hover:bg-emerald-500"
                    onClick={() => {
                      session.timerStart(Math.round(minutes * 60));
                      setShowTimer(false);
                    }}
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
                    onClick={() => {
                      session.timerPause();
                      setShowTimer(false);
                    }}
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
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
