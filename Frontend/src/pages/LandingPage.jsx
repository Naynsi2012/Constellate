import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useRoom } from "../features/rooms/hooks/useRoom";
import { getHostedRoomIds, getName } from "../lib/identity";

const FEATURES = [
  [
    "Anonymous by default",
    "During Diverge, authors are hidden so ideas stand on their own.",
  ],
  [
    "Cluster together",
    "Group related notes into constellations and name the themes.",
  ],
  [
    "Vote to converge",
    "Everyone spends a limited dot budget to surface what matters.",
  ],
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
    const roomId = await handleCreateRoom({ name, question });
    if (roomId) navigate(`/room/${roomId}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase">
            Constellate
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Brainstorming, structured.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-dim">
            A shared canvas for team ideation. Write freely, cluster ideas
            together, vote on what matters, and export the result.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="panel flex flex-col gap-4 p-5">
          <div>
            <label htmlFor="name" className="label">
              Your name
            </label>
            <input
              id="name"
              placeholder="Ada"
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label htmlFor="question" className="label">
              Session question
            </label>
            <input
              id="question"
              placeholder="Optional. You can set it later in the lobby."
              value={question}
              maxLength={200}
              onChange={(e) => setQuestion(e.target.value)}
              className="input"
            />
          </div>
          <button disabled={loading} className="btn-primary mt-1 w-full py-2.5">
            {loading ? "Creating room" : "Create room"}
          </button>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </form>

        <ul className="mt-8 flex flex-col gap-3">
          {FEATURES.map(([title, body]) => (
            <li
              key={title}
              className="rounded-xl border border-line bg-surface-3 px-4 py-3"
            >
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-faint">
                {body}
              </p>
            </li>
          ))}
        </ul>

        {hostedRooms.length > 0 && (
          <section className="mt-10">
            <h2 className="label">Your rooms</h2>
            <ul className="flex flex-col gap-1.5">
              {hostedRooms.map((roomId) => (
                <li key={roomId}>
                  <Link
                    to={`/room/${roomId}`}
                    className="chip w-full justify-between py-2 font-mono text-[13px]! hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
                  >
                    {roomId}
                    <span className="font-sans text-faint">Open</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
