import { useState } from "react";
import { useNavigate } from "react-router";
import { useRoom } from "../features/rooms/hooks/useRoom";
import { getName } from "../lib/identity";

export default function LandingPage() {
  const navigate = useNavigate();
  const { loading, error, handleCreateRoom } = useRoom();

  const [name, setName] = useState(getName());
  const [question, setQuestion] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;

    const roomId = await handleCreateRoom({ name, question });
    if (roomId) navigate(`/room/${roomId}`);
  }

  return (
    <main className="max-w-120 my-16 mx-auto py-0 px-4">
      <h1>Constellate</h1>
      <p>Start a brainstorm and share the link.</p>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Session question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button disabled={loading}>
          {loading ? "Creating…" : "Create room"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
