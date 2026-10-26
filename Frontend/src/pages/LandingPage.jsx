import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useRoom } from "../features/rooms/hooks/useRoom";
import { getHostedRoomIds, getName } from "../lib/identity";

const WORDS = [
  { text: "messy", font: '"Rock Salt", cursive' },
  {
    text: "creative",
    font: '"Instrument Serif", serif',
    italic: true,
  },
  { text: "bold", font: '"Syne", sans-serif', weight: 800 },
  {
    text: "curious",
    font: '"Playfair Display", serif',
    italic: true,
    weight: 700,
  },
  { text: "chaotic", font: '"Permanent Marker", cursive' },
  { text: "wild", font: '"Caveat Brush", cursive' },
];

const WORD_INTERVAL = 2600;
const WORD_EXIT = 380;
const WORD_SIZE = "0.85em"; // same size for every word, so nothing shifts

const STEPS = [
  {
    title: "Add your ideas",
    description: "Write down your ideas and let everyone add theirs.",
  },
  {
    title: "Group similar ideas",
    description: "Move related notes together and give each group a name.",
  },
  {
    title: "Pick the best ideas",
    description:
      "Vote for the ideas you like most and see which ones get the most votes.",
  },
];

function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let swapTimer;
    const timer = setInterval(() => {
      setLeaving(true);
      swapTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setLeaving(false);
      }, WORD_EXIT);
    }, WORD_INTERVAL);

    return () => {
      clearInterval(timer);
      clearTimeout(swapTimer);
    };
  }, []);

  const word = WORDS[index];

  // Inline, so it sits right after "start" on the same line.
  return (
    <span className="ml-[0.25em] inline-block whitespace-nowrap align-baseline text-accent">
      <span
        key={index}
        aria-hidden="true"
        className={`inline-block ${leaving ? "word-out" : "word-in"}`}
        style={{
          fontFamily: word.font,
          fontSize: WORD_SIZE,
          fontStyle: word.italic ? "italic" : "normal",
          fontWeight: word.weight ?? 400,
          letterSpacing: "-0.01em",
        }}
      >
        {word.text}.
      </span>
      <span className="sr-only">
        messy, creative, bold, curious, chaotic, wild.
      </span>
    </span>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-card w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-dim">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 rounded-full p-2 text-dim transition-colors hover:text-ink"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { loading, error, handleCreateRoom } = useRoom();

  const [modal, setModal] = useState(null); // "create" | "join" | null
  const [name, setName] = useState(getName());
  const [question, setQuestion] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const hostedRooms = getHostedRoomIds();

  async function handleCreate(event) {
    event.preventDefault();
    if (!name.trim()) return;

    const roomId = await handleCreateRoom({
      name: name.trim(),
      question: question.trim(),
    });

    if (roomId) navigate(`/room/${roomId}`);
  }

  function handleJoin(event) {
    event.preventDefault();
    // Accepts a bare room code or a full pasted link.
    const roomId = joinCode.trim().split("/").filter(Boolean).pop();
    if (roomId) navigate(`/room/${roomId}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas font-body text-ink">
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-7 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-3 font-display text-base font-semibold tracking-tight text-ink"
          >
            Constellate
          </Link>

          <button
            type="button"
            onClick={() => setModal("create")}
            className="rounded-full border border-line bg-surface-raised px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-hover"
          >
            Get started
          </button>
        </header>

        <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_18rem] lg:gap-16 lg:py-10">
          <section>
            <h1 className="font-display text-6xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-7xl lg:text-[7.5rem]">
              Good ideas
              <br />
              start
              <RotatingWord />
            </h1>

            <ul className="mt-12 max-w-lg space-y-7">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="step-in"
                  style={{ animationDelay: `${0.5 + i * 0.35}s` }}
                >
                  <h2 className="text-base font-semibold text-ink">
                    {step.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-dim">
                    {step.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex w-full max-w-sm flex-col gap-4 lg:ml-auto">
            <button
              type="button"
              onClick={() => setModal("create")}
              className="cta-btn group flex items-center justify-between rounded-2xl bg-accent px-6 py-5 text-lg font-semibold text-accent-contrast transition-colors hover:bg-accent-strong"
            >
              Create a room
              <span
                className="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </button>

            <button
              type="button"
              onClick={() => setModal("join")}
              className="group flex items-center justify-between rounded-2xl border border-line bg-surface-raised px-6 py-5 text-lg font-semibold text-ink transition-colors hover:bg-surface-hover"
            >
              Join a room
              <span
                className="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </button>

            <p className="mt-2 text-sm leading-6 text-faint">
              No sign-up. Create a room, share the link, and start thinking
              together.
            </p>
          </section>
        </div>
      </div>

      {modal === "create" && (
        <Modal
          title="Create a room"
          subtitle="Enter your name and what you want to discuss. You can invite others after creating the room."
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-dim"
              >
                Your name
              </label>
              <input
                id="name"
                autoFocus
                placeholder="e.g. Ada"
                value={name}
                maxLength={30}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm text-ink placeholder:text-faint focus:border-accent-strong focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="question"
                className="mb-2 block text-sm font-medium text-dim"
              >
                What do you want to discuss?
                <span className="ml-2 font-normal text-faint">Optional</span>
              </label>
              <textarea
                id="question"
                placeholder="Ideas for our next project"
                value={question}
                maxLength={200}
                rows={3}
                onChange={(event) => setQuestion(event.target.value)}
                className="w-full resize-y rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm leading-6 text-ink placeholder:text-faint focus:border-accent-strong focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating your room…" : "Create room"}
            </button>

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
          </form>
        </Modal>
      )}

      {modal === "join" && (
        <Modal
          title="Join a room"
          subtitle="Paste the room link or enter the room code you were given."
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleJoin} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="code"
                className="mb-2 block text-sm font-medium text-dim"
              >
                Room link or code
              </label>
              <input
                id="code"
                autoFocus
                placeholder="Paste a link or code"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                required
                className="w-full rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm text-ink placeholder:text-faint focus:border-accent-strong focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              Join room
            </button>
          </form>

          {hostedRooms.length > 0 && (
            <div className="mt-7">
              <h3 className="mb-2 text-sm font-medium text-dim">
                Rooms you've hosted
              </h3>
              <ul className="max-h-40 divide-y divide-line overflow-y-auto border-y border-line">
                {hostedRooms.map((roomId) => (
                  <li key={roomId}>
                    <Link
                      to={`/room/${roomId}`}
                      className="flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:text-accent"
                    >
                      <span className="font-mono text-xs">{roomId}</span>
                      <span className="text-xs text-dim">Open</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Modal>
      )}
    </main>
  );
}
