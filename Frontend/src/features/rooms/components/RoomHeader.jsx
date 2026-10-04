import { useState } from "react";
import { Link } from "react-router";

export default function RoomHeader({ roomId, room, you, people, status }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", window.location.href);
    }
  }

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-2 text-sm">
      <Link to="/" className="font-semibold">
        Constellate
      </Link>

      <span className="max-w-xs truncate opacity-70" title={room.question}>
        {room.question || "No session question"}
      </span>

      <span className="rounded bg-white/10 px-2 py-0.5 font-mono">{roomId}</span>
      {you.isHost && (
        <span className="rounded bg-amber-400/20 px-2 py-0.5 text-amber-300">Host</span>
      )}

      <ul className="flex items-center gap-1">
        {Object.entries(people).map(([userId, person]) => (
          <li
            key={userId}
            title={person.name}
            className="grid size-6 place-items-center rounded-full text-xs font-semibold text-slate-900"
            style={{ background: person.color }}
          >
            {person.name.slice(0, 1).toUpperCase()}
          </li>
        ))}
      </ul>

      {status !== "joined" && <span className="text-amber-300">Reconnecting…</span>}

      <div className="ml-auto flex items-center gap-3">
        <button type="button" onClick={copyLink} className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">
          {copied ? "Copied!" : "Copy link"}
        </button>
        <Link to={`/room/${roomId}/results`} className="opacity-80 hover:opacity-100">
          Results
        </Link>
        <Link to="/" className="opacity-80 hover:opacity-100">
          New room
        </Link>
      </div>
    </header>
  );
}