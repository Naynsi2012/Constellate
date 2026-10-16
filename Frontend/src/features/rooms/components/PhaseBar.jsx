import { useEffect, useId, useState } from "react";
import { PHASES, PHASE_LABELS } from "../socket/events";

function useTimerDisplay(timer) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!timer?.running) return undefined;

    const intervalId = window.setInterval(() => {
      tick((value) => value + 1);
    }, 500);

    return () => window.clearInterval(intervalId);
  }, [timer?.running, timer?.endsAt]);

  if (!timer) return null;

  const remaining =
    timer.running && timer.endsAt
      ? Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000))
      : Math.max(0, Number(timer.remaining) || 0);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function PhaseBar({ room, you, session, compact = false }) {
  const phase = room?.phase;
  const phaseIndex = PHASES.indexOf(phase);
  const index = phaseIndex >= 0 ? phaseIndex : 0;
  const timer = room?.settings?.timer;
  const timerDisplay = useTimerDisplay(timer);
  const durationInputId = useId();

  const [showTimer, setShowTimer] = useState(false);
  const [minutes, setMinutes] = useState("10");

  const isHost = Boolean(you?.isHost);
  const next = PHASES[index + 1];
  const prev = PHASES[index - 1];

  useEffect(() => {
    if (!showTimer) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setShowTimer(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showTimer]);

  function startTimer() {
    const safeMinutes = Math.min(120, Math.max(1, Number(minutes) || 1));

    session.timerStart(Math.round(safeMinutes * 60));
    setMinutes(String(safeMinutes));
    setShowTimer(false);
  }

  function updateMinutes(value) {
    if (value === "") {
      setMinutes("");
      return;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) return;

    setMinutes(String(Math.min(120, Math.max(1, Math.floor(parsed)))));
  }

  const phaseSteps = (
    <ol
      aria-label="Session workflow"
      className={
        compact
          ? "flex flex-col gap-1"
          : "flex min-w-0 items-center gap-1 overflow-x-auto"
      }
    >
      {PHASES.map((item, itemIndex) => {
        const state =
          itemIndex < index ? "done" : itemIndex === index ? "active" : "todo";

        return (
          <li
            key={item}
            className={compact ? "min-w-0" : "flex shrink-0 items-center gap-1"}
          >
            <span
              aria-current={state === "active" ? "step" : undefined}
              title={PHASE_LABELS[item]}
              className={`flex items-center gap-2 rounded-lg border text-[11px] font-medium transition-colors ${
                compact ? "min-h-9 w-full px-2.5" : "min-h-8 px-2 sm:px-2.5"
              } ${
                state === "active"
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : state === "done"
                    ? "border-green-400/20 bg-green-400/5 text-green-300"
                    : "border-line/70 bg-transparent text-faint"
              }`}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-md text-[10px] ${
                  state === "done"
                    ? "bg-green-400/15 text-green-300"
                    : state === "active"
                      ? "bg-accent/20 text-accent"
                      : "bg-surface-hover text-faint"
                }`}
              >
                {state === "done" ? "✓" : itemIndex + 1}
              </span>

              <span className="min-w-0 flex-1 truncate">
                {PHASE_LABELS[item]}
              </span>

              {compact && state === "active" && (
                <span className="shrink-0 text-[9px] uppercase tracking-wide text-accent">
                  Current
                </span>
              )}
            </span>

            {!compact && itemIndex < PHASES.length - 1 && (
              <span
                className={`h-px w-1.5 shrink-0 sm:w-2 ${
                  itemIndex < index ? "bg-green-400/40" : "bg-line"
                }`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );

  const phaseButtons = (
    <div
      className={
        compact ? "grid grid-cols-2 gap-2" : "flex items-center gap-1.5"
      }
    >
      {prev && (
        <button
          type="button"
          onClick={() => session.setPhase(prev)}
          className={`min-h-9 rounded-lg border border-line px-3 text-[11px] font-medium text-dim transition-colors hover:bg-surface-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            compact ? "w-full" : ""
          }`}
        >
          ← Back
        </button>
      )}

      {next && (
        <button
          type="button"
          onClick={() => session.setPhase(next)}
          title="Ctrl/Cmd + Enter"
          className={`min-h-9 rounded-lg bg-accent px-3 text-[11px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            compact ? "w-full" : ""
          }`}
        >
          {PHASE_LABELS[next]} →
        </button>
      )}
    </div>
  );

  const timerButton = isHost ? (
    <div className={`relative min-w-0 ${compact ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => setShowTimer((value) => !value)}
        aria-expanded={showTimer}
        aria-haspopup="dialog"
        aria-label="Timer settings"
        className={`inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border px-3 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          showTimer
            ? "border-accent/40 bg-accent/10 text-accent"
            : "border-line bg-surface-raised text-dim hover:text-ink"
        }`}
      >
        <ClockIcon />
        Timer
      </button>

      {showTimer && (
        <>
          {compact && (
            <button
              type="button"
              aria-label="Close timer settings"
              onClick={() => setShowTimer(false)}
              className="fixed inset-0 z-[119] cursor-default bg-black/30"
            />
          )}

          <div
            role="dialog"
            aria-modal={compact ? "true" : undefined}
            aria-labelledby={`${durationInputId}-title`}
            className={`z-[120] flex w-[min(17rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl border border-line bg-surface-raised p-3.5 shadow-2xl shadow-black/30 ${
              compact
                ? "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                : "absolute right-0 top-full mt-2"
            }`}
          >
            <div>
              <p
                id={`${durationInputId}-title`}
                className="text-xs font-semibold text-ink"
              >
                Session timer
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-faint">
                Set a time limit for the current activity.
              </p>
            </div>

            <label
              htmlFor={durationInputId}
              className="flex items-center justify-between gap-3 text-xs text-dim"
            >
              Duration
              <span className="flex items-center gap-2">
                <input
                  id={durationInputId}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={120}
                  step={1}
                  value={minutes}
                  onChange={(event) => updateMinutes(event.target.value)}
                  onKeyDown={(event) => {
                    event.stopPropagation();

                    if (event.key === "Enter") {
                      startTimer();
                    }
                  }}
                  className="w-16 rounded-lg border border-line bg-canvas px-2 py-2 text-center text-xs text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                <span className="text-faint">min</span>
              </span>
            </label>

            <p className="text-[10px] text-faint">
              Choose between 1 and 120 minutes.
            </p>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={startTimer}
                className="min-h-9 rounded-lg bg-accent px-2 text-xs font-semibold text-accent-contrast transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Start
              </button>

              <button
                type="button"
                onClick={() => {
                  session.timerPause();
                  setShowTimer(false);
                }}
                className="min-h-9 rounded-lg border border-line px-2 text-xs text-dim transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Pause
              </button>

              <button
                type="button"
                onClick={() => {
                  session.timerReset();
                  setShowTimer(false);
                }}
                className="min-h-9 rounded-lg border border-line px-2 text-xs text-dim transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Reset
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowTimer(false)}
              className="self-end rounded px-2 py-1 text-[11px] text-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  ) : null;

  if (compact) {
    return (
      <div className="min-w-0 space-y-3">
        <section>{phaseSteps}</section>

        {isHost && (
          <section className="space-y-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">
              Phase controls
            </p>

            {phaseButtons}
            {timerButton}
          </section>
        )}

        {timerDisplay && (
          <div className="flex items-center justify-between rounded-lg border border-line bg-canvas/60 px-3 py-2 font-mono text-xs text-dim">
            <span className="inline-flex items-center gap-2">
              <ClockIcon />
              Session timer
            </span>

            <span
              className={timer?.running ? "text-amber-200" : "text-ink"}
              aria-live={timer?.running ? "off" : "polite"}
            >
              {timerDisplay}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative z-20 flex min-w-0 shrink-0 items-center gap-2 border-b border-line bg-surface/95 px-2.5 py-2 backdrop-blur-xl sm:gap-3 sm:px-4 sm:py-2.5 lg:gap-4 lg:px-5">
      <div className="min-w-0 flex-1">{phaseSteps}</div>

      {timerDisplay &&
        (timer?.running || timer?.remaining !== timer?.duration) && (
          <div
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-2 font-mono text-[10px] tabular-nums sm:gap-2 sm:px-2.5 sm:text-[11px] ${
              timer?.running
                ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
                : "border-line bg-surface-raised text-dim"
            }`}
            title="Session timer"
          >
            <ClockIcon />
            <span>{timerDisplay}</span>
          </div>
        )}

      {isHost && (
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {phaseButtons}
          <div className="w-[4.5rem] sm:w-24">{timerButton}</div>
        </div>
      )}
    </div>
  );
}
