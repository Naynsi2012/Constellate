import { useState } from "react";

export default function LobbyPrompt({ isHost, onSubmit }) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim()) return;
    setBusy(true);
    await onSubmit(question.trim());
    setBusy(false);
  }

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm">
      {isHost ? (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        >
          <div>
            <p className="mb-1 text-xs font-semibold tracking-widest text-indigo-300">
              LOBBY
            </p>
            <h2 className="text-xl font-semibold text-slate-100">
              What problem are we solving?
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              This becomes the anchor in the center of the board, and the
              heading of the results.
            </p>
          </div>
          <input
            autoFocus
            maxLength={200}
            placeholder="How can we reduce food waste on campus?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="rounded-lg bg-white/10 px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-400/60"
          />
          <button
            disabled={!question.trim() || busy}
            className="rounded-lg bg-indigo-500 px-3 py-2.5 font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {busy ? "Starting…" : "Start brainstorm"}
          </button>
        </form>
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl">
          <p className="mb-1 text-xs font-semibold tracking-widest text-indigo-300">
            LOBBY
          </p>
          <h2 className="text-xl font-semibold text-slate-100">
            Waiting for the host…
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            The host is setting the session question. The board opens as soon as
            they start.
          </p>
          <p className="mt-4 animate-pulse text-2xl text-indigo-300">✦ ✦ ✦</p>
        </div>
      )}
    </div>
  );
}
