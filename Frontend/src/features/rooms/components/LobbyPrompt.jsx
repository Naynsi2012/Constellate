import { useState } from "react";

export default function LobbyPrompt({ isHost, onSubmit }) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || busy) return;

    setBusy(true);

    try {
      await onSubmit(trimmedQuestion);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-canvas/85 px-4 py-8 backdrop-blur-md">
      <div className="w-full max-w-lg">
        {isHost ? (
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-2xl shadow-black/30 sm:p-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                What problem are we solving?
              </h2>

              <p className="mt-3 text-sm leading-6 text-dim">
                Start with a clear question. It becomes the anchor for your
                board and the heading for your session results.
              </p>
            </div>

            <label
              htmlFor="session-question"
              className="mb-2 block text-xs font-medium text-ink"
            >
              Your session question
            </label>

            <textarea
              id="session-question"
              autoFocus
              maxLength={200}
              rows={3}
              placeholder="How can we reduce food waste on campus?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="w-full resize-y rounded-2xl border border-line bg-canvas px-4 py-3 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />

            <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
              <span>Keep it specific and open-ended.</span>
              <span>{question.length}/200</span>
            </div>

            <button
              type="submit"
              disabled={!question.trim() || busy}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Starting session…" : "Start brainstorming"}
              {!busy && <span aria-hidden="true">→</span>}
            </button>

            <p className="mt-4 text-center text-[11px] leading-5 text-faint">
              You can move through the phases as your group develops ideas.
            </p>
          </form>
        ) : (
          <div className="rounded-3xl border border-line bg-surface p-6 text-center shadow-2xl shadow-black/30 sm:p-8">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
              <span className="size-5 animate-spin rounded-full border-2 border-line border-t-accent" />
            </div>

            <p className="mt-5 text-[10px] font-semibold tracking-[0.16em] text-faint uppercase">
              Session lobby
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              The ideas are gathering.
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-dim">
              The host is preparing the session question. The board will be
              ready as soon as they start.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3 py-2 text-xs text-faint">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              Waiting for the host
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
