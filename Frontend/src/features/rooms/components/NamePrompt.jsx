import { useState } from "react";

export default function NamePrompt({ roomId, onSubmit }) {
  const [name, setName] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (name.trim()) onSubmit(name.trim());
  }

  return (
    <main className="grid h-screen place-items-center px-4">
      <form
        onSubmit={handleSubmit}
        className="panel flex w-full max-w-sm flex-col gap-4 p-6"
      >
        <div>
          <p className="label">Constellate</p>
          <h1 className="text-lg font-semibold text-ink">Join room {roomId}</h1>
          <p className="mt-1 text-sm text-dim">
            Pick a name so others can see who is here.
          </p>
        </div>
        <input
          autoFocus
          maxLength={30}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
        <button disabled={!name.trim()} className="btn-primary">
          Join
        </button>
      </form>
    </main>
  );
}
