import { useState } from "react";
import { Link } from "react-router";

export default function RoomHeader({ roomId, room, you, people, status }) {
  const [copied, setCopied] = useState(false);
  const [showPeople, setShowPeople] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", window.location.href);
    }
  }

  const entries = Object.entries(people);

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-2 text-sm">
      <Link to="/" className="font-semibold tracking-wide">
        Constellate
      </Link>

      <span className="max-w-3xs truncate opacity-70" title={room.question}>
        {room.question || "No session question yet"}
      </span>

      <span className="rounded bg-white/10 px-2 py-0.5 font-mono">
        {roomId}
      </span>
      {you.isHost && (
        <span className="rounded bg-amber-400/20 px-2 py-0.5 text-amber-300">
          Host
        </span>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPeople((v) => !v)}
          className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-white/10"
          title="Participants"
        >
          <ul className="flex items-center -space-x-1.5">
            {entries.slice(0, 8).map(([userId, person]) => (
              <li
                key={userId}
                className="grid size-6 place-items-center rounded-full border border-slate-950 text-xs font-semibold text-slate-900"
                style={{ background: person.color }}
              >
                {person.name.slice(0, 1).toUpperCase()}
              </li>
            ))}
          </ul>
          <span className="ml-1 text-xs opacity-70">{entries.length}</span>
        </button>
        {showPeople && (
          <ul className="absolute left-0 top-8 z-30 min-w-44 rounded-lg border border-white/15 bg-slate-900 py-1 shadow-xl">
            {entries.map(([userId, person]) => (
              <li
                key={userId}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-200"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: person.color }}
                />
                {person.name}
                {userId === you.userId && (
                  <span className="opacity-50">(you)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {status !== "joined" && (
        <span className="text-amber-300">Reconnecting…</span>
      )}

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={copyLink}
          className="rounded bg-white/10 px-3 py-1 hover:bg-white/20"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        <Link
          to={`/room/${roomId}/results`}
          className="opacity-80 hover:opacity-100"
        >
          Results
        </Link>
        <Link to="/" className="opacity-80 hover:opacity-100">
          New room
        </Link>
      </div>
    </header>
  );
}
