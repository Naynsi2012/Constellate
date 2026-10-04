import { Link, useParams } from "react-router";

const Board = () => {
  const { roomId } = useParams();
  const isHost = Boolean(localStorage.getItem(`host:${roomId}`));

  return (
    <main className="p-4">
      <h2>Board: room {roomId}</h2>
      <p>{isHost ? "You are the host." : "You are a participant."}</p>
      <Link to={`/room/${roomId}/results`}>Go to results</Link>
    </main>
  );
};

export default Board;
