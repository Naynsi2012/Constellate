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
    <header className="relative z-20 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-surface-1 px-3 py-2 text-sm backdrop-blur sm:px-4">
      <Link
        to="/"
        className="text-xs font-semibold tracking-widest text-accent uppercase"
      >
        Constellate
      </Link>

      <span className="hidden max-w-3xs truncate text-dim sm:inline" title={room.question}>
        {room.question || "No session question yet"}
      </span>

      <span className="chip font-mono">{roomId}</span>
      {you.isHost && (
        <span className="chip border-amber/30! bg-amber/10! text-amber!">
          Host
        </span>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPeople((v) => !v)}
          className="flex cursor-pointer items-center gap-1 rounded-lg px-1 py-0.5 transition-colors hover:bg-surface-4"
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
          <span className="ml-1 text-xs text-faint">{entries.length}</span>
        </button>
        {showPeople && (
          <ul className="panel absolute left-0 top-9 z-30 min-w-44 py-1">
            {entries.map(([userId, person]) => (
              <li
                key={userId}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-ink"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: person.color }}
                />
                {person.name}
                {userId === you.userId && (
                  <span className="text-faint">(you)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {status !== "joined" && (
        <span className="text-xs text-amber">Reconnecting</span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="btn-ghost px-3! py-1! text-xs!"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <Link
          to={`/room/${roomId}/results`}
          className="text-xs text-dim transition-colors hover:text-ink"
        >
          Results
        </Link>
        <Link
          to="/"
          className="hidden text-xs text-dim transition-colors hover:text-ink sm:inline"
        >
          New room
        </Link>
      </div>
    </header>
  );
}
