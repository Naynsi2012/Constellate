import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import PhaseBar from "./PhaseBar";

function MenuIcon({ open = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      {open ? (
        <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      )}
    </svg>
  );
}

function getPersonName(person) {
  return (
    person?.name ||
    person?.displayName ||
    person?.username ||
    person?.userName ||
    "Participant"
  );
}

function getPersonId(person, index) {
  return (
    person?.userId ??
    person?.id ??
    person?.socketId ??
    `${getPersonName(person)}-${index}`
  );
}

function getInitials(name) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function PersonAvatar({ person }) {
  const name = getPersonName(person);

  return (
    <span
      title={name}
      aria-label={name}
      className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-surface bg-surface-hover text-[9px] font-semibold text-ink"
    >
      {getInitials(name)}
    </span>
  );
}

export default function RoomHeader({
  roomId,
  room,
  you,
  people = [],
  status,
  session,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const participants = useMemo(() => {
    const list = Array.isArray(people)
      ? people
      : people && typeof people === "object"
        ? Object.values(people)
        : [];

    const seen = new Set();

    return list.filter((person, index) => {
      const id = getPersonId(person, index);

      if (seen.has(id)) return false;

      seen.add(id);
      return true;
    });
  }, [people]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setCopied(false);
  }, [roomId]);

  useEffect(() => {
    if (!copied) return undefined;

    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function copyInvite() {
    const inviteUrl = window.location.href;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable");
      }

      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      window.prompt("Copy this invite link:", inviteUrl);
    }
  }

  const roomActions = (
    <section className="min-w-0">
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-faint">
        Room actions
      </p>

      <div className="grid gap-1.5">
        <button
          type="button"
          onClick={copyInvite}
          className="flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface-raised px-3 text-left text-xs font-medium text-ink transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span aria-hidden="true" className="text-dim">
            ↗
          </span>
          {copied ? "Invite link copied" : "Share invite"}
        </button>

        <Link
          to={`/room/${roomId}/results`}
          onClick={() => setMenuOpen(false)}
          className="flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface-raised px-3 text-xs font-medium text-ink transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span aria-hidden="true" className="text-dim">
            ↗
          </span>
          View results
        </Link>

        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface-raised px-3 text-xs font-medium text-ink transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span aria-hidden="true" className="text-dim">
            +
          </span>
          Create a new room
        </Link>
      </div>
    </section>
  );

  return (
    <>
      <header className="relative z-40 flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:h-13.5 sm:px-4 lg:px-5">
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          aria-label="Constellate home"
          className="flex min-w-0 shrink items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold leading-tight text-ink sm:text-sm">
              Constellate
            </span>
            <span className="mt-0.5 block max-w-28 truncate text-[9px] leading-tight text-faint sm:text-[10px]">
              Room {roomId}
            </span>
          </span>
        </Link>

        <span className="mx-1 hidden h-6 w-px shrink-0 bg-line sm:block" />

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open room menu"
            aria-expanded={menuOpen}
            aria-controls="room-menu"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-line/70 text-ink transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <MenuIcon />
          </button>
        </div>

        <div className="ml-auto hidden min-w-0 items-center gap-2 md:flex">
          {participants.length > 0 && (
            <div
              className="flex items-center"
              aria-label={`${participants.length} participants`}
            >
              {participants.slice(0, 5).map((person, index) => (
                <span
                  key={getPersonId(person, index)}
                  className={index === 0 ? "" : "-ml-2"}
                >
                  <PersonAvatar person={person} />
                </span>
              ))}

              {participants.length > 5 && (
                <span className="-ml-2 grid size-7 place-items-center rounded-full border-2 border-surface bg-surface-hover text-[9px] text-ink">
                  +{participants.length - 5}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={copyInvite}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-line bg-surface-raised px-2.5 text-[11px] font-medium text-ink transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-3 sm:text-xs"
          >
            <span aria-hidden="true">↗</span>
            {copied ? "Copied" : "Copy invite"}
          </button>

          <Link
            to={`/room/${roomId}/results`}
            className="rounded-lg px-2 py-2 text-[11px] text-dim transition-colors hover:bg-surface-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-xs"
          >
            Results
          </Link>

          <Link
            to="/"
            className="rounded-lg px-2 py-2 text-[11px] text-dim transition-colors hover:bg-surface-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-xs"
          >
            New room
          </Link>
        </div>

        {/* Tablet and small desktop also need access to the room actions. */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open room menu"
          aria-expanded={menuOpen}
          aria-controls="room-menu"
          className="ml-auto hidden size-8 shrink-0 place-items-center rounded-lg border border-line/70 text-ink transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid md:hidden"
        >
          <MenuIcon />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-100 md:hidden">
          <button
            type="button"
            aria-label="Close room menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
          />

          <aside
            id="room-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Room menu"
            className="absolute inset-y-0 right-0 flex w-[min(19rem,88vw)] flex-col overflow-hidden border-l border-line bg-surface shadow-2xl shadow-black/40"
          >
            <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3 sm:h-13.5 sm:px-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink">Room menu</p>
                <p className="truncate text-[9px] text-faint">{roomId}</p>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close room menu"
                className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-dim hover:bg-surface-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <MenuIcon open />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3 sm:px-3.5">
              {session && (
                <section className="min-w-0">
                  <PhaseBar room={room} you={you} session={session} compact />
                </section>
              )}

              <div className="h-px bg-line" />

              <section className="min-w-0">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-faint">
                  Participants
                  <span className="ml-1.5 font-normal normal-case tracking-normal">
                    {participants.length}
                  </span>
                </p>

                {participants.length > 0 ? (
                  <ul className="space-y-0.5">
                    {participants.map((person, index) => {
                      const personName = getPersonName(person);
                      const personId = getPersonId(person, index);
                      const isYou =
                        (you?.userId != null &&
                          person?.userId === you.userId) ||
                        (you?.userId != null && person?.id === you.userId);

                      return (
                        <li
                          key={personId}
                          className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1"
                        >
                          <PersonAvatar person={person} />
                          <span className="min-w-0 flex-1 truncate text-[11px] text-ink">
                            {personName}
                          </span>
                          {isYou && (
                            <span className="shrink-0 text-[9px] text-faint">
                              You
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-[11px] text-faint">
                    Waiting for participants…
                  </p>
                )}
              </section>

              <div className="h-px bg-line" />

              {roomActions}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
