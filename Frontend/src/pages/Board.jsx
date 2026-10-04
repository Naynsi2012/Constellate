import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useRoomSession } from "../features/rooms/hooks/useRoomSession";
import NamePrompt from "../features/rooms/components/NamePrompt";
import RoomHeader from "../features/rooms/components/RoomHeader";
import BoardCanvas from "../features/rooms/components/BoardCanvas";
import { getName, removeHostToken, saveName } from "../lib/identity";

const Board = () => {
  const { roomId } = useParams();
  const [name, setName] = useState(getName());
  const session = useRoomSession(roomId, name);
  const { status, error, you, room, people, notes } = session;

  useEffect(() => {
    if (status === "error" && /not found/i.test(error ?? "")) removeHostToken(roomId);
  }, [status, error, roomId]);

  if (!name) {
    return (
      <NamePrompt
        roomId={roomId}
        onSubmit={(choosen) => {
          saveName(choosen);
          setName(choosen);
        }}
      />
    );
  }

  if (status === "error") {
    return (
      <main className="grid h-screen place-items-center bg-slate-950 px-4 text-slate-100">
        <div className="max-w-sm text-center">
          <h1 className="mb-2 text-xl font-semibold">
            Couldn't join this room
          </h1>
          <p className="mb-4 opacity-70">{error}</p>
          <Link
            to="/"
            className="rounded bg-white px-3 py-2 font-medium text-slate-900"
          >
            Create a new room
          </Link>
        </div>
      </main>
    );
  }

  if (!room || !you) {
    return (
      <main className="grid h-screen place-items-center bg-slate-950 text-slate-100">
        <p className="opacity-70">Connecting...</p>
      </main>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <RoomHeader
        roomId={roomId}
        room={room}
        you={you}
        people={people}
        status={status}
      />
      <div className="min-h-0 flex-1">
        <BoardCanvas
          you={you}
          room={room}
          people={people}
          notes={notes}
          createNote={session.createNote}
          moveNote={session.moveNote}
          updateNote={session.updateNote}
          deleteNote={session.deleteNote}
        />
      </div>
    </div>
  );
};

export default Board;
