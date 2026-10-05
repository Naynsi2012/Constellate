import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useRoom } from "../features/rooms/hooks/useRoom";
import { getHostedRoomIds, getName } from "../lib/identity";

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
    <main className="flex min-h-screen flex-col items-center bg-slate-950 px-4 py-20 text-slate-100">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold tracking-tight">Constellate</h1>
        <p className="mt-2 text-slate-400">
          Anonymous-first brainstorming on an infinite night sky. Diverge,
          cluster, converge — then export the results.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <input
            placeholder="Your name"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-lg bg-white/10 px-3 py-2.5 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-400/60"
          />
          <input
            placeholder="Session question (optional — you can set it in the lobby)"
            value={question}
            maxLength={200}
            onChange={(e) => setQuestion(e.target.value)}
            className="rounded-lg bg-white/10 px-3 py-2.5 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-400/60"
          />
          <button
            disabled={loading}
            className="rounded-lg bg-indigo-500 px-3 py-2.5 font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create room"}
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-sm text-rose-300">
            {error}
          </p>
        )}

        {hostedRooms.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-2 text-sm font-semibold tracking-widest text-slate-400">
              YOUR ROOMS
            </h2>
            <ul className="flex flex-col gap-1">
              {hostedRooms.map((roomId) => (
                <li key={roomId}>
                  <Link
                    to={`/room/${roomId}`}
                    className="rounded bg-white/5 px-3 py-1.5 font-mono text-sm text-indigo-300 hover:bg-white/10"
                  >
                    {roomId}
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
