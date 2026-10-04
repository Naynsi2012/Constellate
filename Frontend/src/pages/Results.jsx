import { Link, useParams } from "react-router";

const Results = () => {
  const { roomId } = useParams();
  console.log(roomId)

  return (
    <main className="p-4">
      <h2>Results: room {roomId}</h2>
      <Link to={`/room/${roomId}`}>Back to board</Link>
    </main>
  );
};

export default Results;
