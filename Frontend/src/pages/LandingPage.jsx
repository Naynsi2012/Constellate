import { useState } from "react";
import { useNavigate } from "react-router";

export default function LandingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem("name") ?? "");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createRoom(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const roomId = `${name}+bitch`;
      const hostToken = `${name}+host`;

      localStorage.setItem("name", name.trim());
      localStorage.setItem(`host:${roomId}`, hostToken);
      navigate(`/room/${roomId}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="max-w-120 my-16 mx-auto py-0 px-4">
      <h1>Constellate</h1>
      <p>Start a brainstorm and share the link.</p>
      <form onSubmit={createRoom}>
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
        <button disabled={busy}>{busy ? "Creating…" : "Create room"}</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
