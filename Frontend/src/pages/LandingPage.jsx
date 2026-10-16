import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useRoom } from "../features/rooms/hooks/useRoom";
import { getHostedRoomIds, getName } from "../lib/identity";
import LogoMark from "../components/LogoMark";

const FEATURES = [
  {
    number: "01",
    title: "Think independently",
    description: "Capture ideas before the group converges. Silent brainstorming keeps the focus on the idea, not its author.",
  },
  {
    number: "02",
    title: "Find the patterns",
    description: "Bring related thoughts together, name the themes and turn a scattered board into a shared picture."
  },
  {
    number: "03",
    title: "Decide together",
    description: "Spend a limited number of votes to surface the ideas your team believes matter most."
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { loading, error, handleCreateRoom } = useRoom();

  const [name, setName] = useState(getName());
  const [question, setQuestion] = useState("");

  const hostedRooms = getHostedRoomIds();

  async function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) return;

    const roomId = await handleCreateRoom({
      name: name.trim(),
      question: question.trim(),
    });

    if (roomId) navigate(`/room/${roomId}`);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-canvas text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link
          to="/"
          className="flex items-center gap-3 text-sm font-semibold tracking-wide text-ink"
        >
          <LogoMark />
          CONSTELLATE
        </Link>

        <span className="hidden text-xs tracking-wide text-dim sm:block">
          A shared space to think clearly.
        </span>
      </header>

      <div className="mx-auto grid max-w-7xl items-start gap-14 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:pt-20">
        <section className="max-w-2xl">
          <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            <span className="h-px w-8 bg-accent" />
            Collaborative thinking, made tangible
          </p>

          <h1 className="max-w-xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl">
            Good ideas
            <br />
            start messy<span className="text-accent">.</span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-7 text-dim sm:text-lg">
            Give your team room to think, discover connections, and decide what
            deserves attention. One shared canvas, from first thought to final
            direction.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-1 gap-0 border-y border-line sm:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.number}
                className={`py-5 ${
                  index !== 0
                    ? "border-t border-line sm:border-l sm:border-t-0 sm:pl-4"
                    : ""
                } ${index !== 0 ? "sm:ml-4" : ""}`}
              >
                <span className="text-xs font-medium tracking-widest text-accent">
                  {feature.number}
                </span>
                <h2 className="mt-3 text-sm font-semibold text-ink">
                  {feature.title}
                </h2>
                <p className="mt-2 text-xs leading-5 text-dim">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 hidden max-w-xl sm:block">
            <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="text-xs font-medium text-ink">
                    A glimpse of the process
                  </p>
                  <p className="mt-1 text-xs text-faint">
                    Explore ideas. Connect the dots.
                  </p>
                </div>
                <span className="rounded-full border border-line px-2.5 py-1 text-[10px] text-dim">
                  3 stages
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-5">
                <div className="-rotate-2 rounded-lg border border-amber-200/40 bg-[#f8dfa0] p-3 text-slate-900 shadow-lg shadow-black/10">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                    Diverge
                  </span>
                  <p className="mt-3 text-xs font-medium">
                    What if we tried something new?
                  </p>
                </div>
                <div className="translate-y-2 rotate-2 rounded-lg border border-sky-200/40 bg-[#b9d8f4] p-3 text-slate-900 shadow-lg shadow-black/10">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                    Cluster
                  </span>
                  <p className="mt-3 text-xs font-medium">
                    Find the common thread.
                  </p>
                </div>
                <div className="-rotate-1 rounded-lg border border-emerald-200/40 bg-[#c5dfb8] p-3 text-slate-900 shadow-lg shadow-black/10">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                    Converge
                  </span>
                  <p className="mt-3 text-xs font-medium">
                    Choose what matters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-xl lg:ml-auto">
          <div className="border border-line bg-surface p-5 sm:p-7">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Start a session
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                Bring your team together.
              </h2>
              <p className="mt-2 text-sm leading-6 text-dim">
                Create a room and invite others to contribute.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-xs font-medium text-dim"
                >
                  Your name
                </label>
                <input
                  id="name"
                  placeholder="e.g. Ada"
                  value={name}
                  maxLength={30}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full border border-line bg-canvas px-3.5 py-3 text-sm text-ink placeholder:text-faint focus:border-accent-strong focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="question"
                  className="mb-2 block text-xs font-medium text-dim"
                >
                  What are we trying to solve?
                  <span className="ml-2 font-normal text-faint">Optional</span>
                </label>
                <textarea
                  id="question"
                  placeholder="How might we make our next launch better?"
                  value={question}
                  maxLength={200}
                  rows={3}
                  onChange={(event) => setQuestion(event.target.value)}
                  className="w-full resize-y border border-line bg-canvas px-3.5 py-3 text-sm leading-6 text-ink placeholder:text-faint focus:border-accent-strong focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex w-full items-center justify-center gap-2 bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating your room…" : "Create a room"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>

              {error && (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              )}
            </form>

            <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-faint">
              No setup required. Create a session, share the link, and start
              thinking together.
            </p>
          </div>

          {hostedRooms.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-dim">
                  Your recent rooms
                </h2>
                <span className="text-xs text-faint">
                  {hostedRooms.length} saved
                </span>
              </div>

              <ul className="divide-y divide-line border-y border-line">
                {hostedRooms.map((roomId) => (
                  <li key={roomId}>
                    <Link
                      to={`/room/${roomId}`}
                      className="flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:text-accent"
                    >
                      <span className="font-mono text-xs">{roomId}</span>
                      <span className="text-xs text-dim">Open room →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      </div>

      <footer className="border-t border-line px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs text-faint">
          <span>CONSTELLATE | Think together</span>
          <span>From scattered thoughts to shared direction.</span>
        </div>
      </footer>
    </main>
  );
}
