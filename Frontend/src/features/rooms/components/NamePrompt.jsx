import { useState } from "react";

export default function NamePrompt({ roomId, onSubmit }) {
  const [name, setName] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (name.trim()) onSubmit(name.trim());
  }

  return (
    <main className="grid h-screen place-items-center bg-slate-950 px-4 text-slate-100">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <h1 className="text-xl font-semibold">Join room {roomId}</h1>
        <p className="text-sm opacity-70">Pick a name so others can see who's here.</p>
        <input
          autoFocus
          maxLength={30}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded bg-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/40"
        />
        <button
          disabled={!name.trim()}
          className="rounded bg-white px-3 py-2 font-medium text-slate-900 disabled:opacity-50"
        >
          Join
        </button>
      </form>
    </main>
  );
}