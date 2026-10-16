
import { useState } from "react";

export default function NamePrompt({ roomId, onSubmit }) {
  const [name, setName] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (name.trim()) onSubmit(name.trim());
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="2.3" />
              <circle cx="5" cy="6" r="1.4" />
              <circle cx="19" cy="6" r="1.4" />
              <path d="m10.3 10.5-4-3.3m7.4 3.3 4-3.3" />
            </svg>
          </span>
          <span className="text-sm font-semibold text-ink">Constellate</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-line bg-surface p-6 shadow-2xl shadow-black/25 sm:p-8"
        >
          <p className="text-[10px] font-semibold tracking-[0.16em] text-accent uppercase">
            You're invited
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            Join the conversation.
          </h1>

          <p className="mt-3 text-sm leading-6 text-dim">
            Choose a name so your collaborators know who's adding ideas.
          </p>

          <div className="mt-6 rounded-xl border border-line bg-canvas px-3.5 py-3">
            <p className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
              Room code
            </p>
            <p className="mt-1 break-all font-mono text-sm text-ink">
              {roomId}
            </p>
          </div>

          <label
            htmlFor="participant-name"
            className="mb-2 mt-6 block text-xs font-medium text-ink"
          >
            Your name
          </label>

          <input
            id="participant-name"
            autoFocus
            maxLength={30}
            placeholder="e.g. Ada"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />

          <p className="mt-2 text-right text-[11px] text-faint">
            {name.length}/30
          </p>

          <button
            type="submit"
            disabled={!name.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
          >
            Join room <span aria-hidden="true">→</span>
          </button>

          <p className="mt-4 text-center text-[11px] text-faint">
            Your name helps others recognize your contributions.
          </p>
        </form>
      </div>
    </main>
  );
}