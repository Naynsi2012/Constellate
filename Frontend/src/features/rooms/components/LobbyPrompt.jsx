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
          className="panel flex w-full max-w-md flex-col gap-4 p-6"
        >
          <div>
            <p className="label">Lobby</p>
            <h2 className="text-xl font-semibold text-ink">
              What problem are we solving?
            </h2>
            <p className="mt-1 text-sm text-dim">
              This becomes the anchor in the center of the board and the heading
              of the results.
            </p>
          </div>
          <input
            autoFocus
            maxLength={200}
            placeholder="How can we reduce food waste on campus?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="input"
          />
          <button
            disabled={!question.trim() || busy}
            className="btn-primary py-2.5"
          >
            {busy ? "Starting" : "Start brainstorm"}
          </button>
        </form>
      ) : (
        <div className="panel w-full max-w-md p-6 text-center">
          <p className="label">Lobby</p>
          <h2 className="text-xl font-semibold text-ink">
            Waiting for the host
          </h2>
          <p className="mt-1 text-sm text-dim">
            The host is setting the session question. The board opens as soon as
            they start.
          </p>
          <div className="mt-5 flex justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-line border-t-accent" />
          </div>
        </div>
      )}
    </div>
  );
}
