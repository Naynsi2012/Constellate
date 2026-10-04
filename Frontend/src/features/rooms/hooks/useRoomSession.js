import { useEffect, useState, useCallback } from "react";
import { socket } from "../../../lib/socket";
import { getColor, getHostToken, getUserId } from "../../../lib/identity";

export function useRoomSession(roomId, name) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [you, setYou] = useState(null);
  const [room, setRoom] = useState(null);
  const [notes, setNotes] = useState({});
  const [people, setPeople] = useState({});

  useEffect(() => {
    if (!roomId || !name) return;
    setStatus("connecting");
    setError(null);

    function join() {
      socket.emit(
        "join",
        {
          roomId,
          userId: getUserId(),
          name,
          color: getColor(),
          hostToken: getHostToken(roomId),
        },
        (res) => {
          if (!res?.ok) {
            setError(res?.error ?? "COuld not join the room");
            setStatus("error");
            return;
          }

          const { notes, participants, ...roomInfo } = res.state;
          setYou(res.you);
          setRoom(roomInfo);
          setNotes(notes);
          setPeople(participants);
          setStatus("joined");
        },
      );
    }

    const onNoteCreated = (note) => setNotes((prev) => ({ ...prev, [note.id]: note }));
    const onNoteChanged = (change) =>
      setNotes(
        prev[change.id]
          ? { ...prev, [change.id]: { ...prev[change.id], ...change } }
          : prev,
      );
    const onNoteDeleted = ({ id }) =>
      setNotes((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
    const onPresenceJoin = ({ userId, name, color }) => setPeople((prev) => ({ ...prev, [userId]: { name, color } }));
    const onDisconnect = () => setStatus("connecting");

    socket.on("connect", join);
    socket.on("disconnect", onDisconnect);
    socket.on("note:created", onNoteCreated);
    socket.on("note:updated", onNoteChanged);
    socket.on("note:moved", onNoteChanged);
    socket.on("note:deleted", onNoteDeleted);
    socket.on("presence:join", onPresenceJoin);

    if (socket.connected) join();
    else socket.connect();

    return () => {
      socket.off("connect", join);
      socket.off("disconnect", onDisconnect);
      socket.off("note:created", onNoteCreated);
      socket.off("note:updated", onNoteChanged);
      socket.off("note:moved", onNoteChanged);
      socket.off("note:deleted", onNoteDeleted);
      socket.off("presence:join", onPresenceJoin);
      socket.disconnect();
    };
  }, [roomId, name]);

  const send = useCallback(
    (event, payload) =>
      new Promise((resolve) => socket.emit(event, payload, resolve), []),
  );

  const createNote = useCallback(
    async ({ x, y, text = "", color }) => {
      const res = await send("note:create", { x, y, text, color });
      if (res.ok) setNotes((prev) => ({ ...prev, [res.note.id]: res.note }));

      return res;
    },
    [send],
  );

  const moveNote = useCallback(
    (id, x, y) => {
      setNotes((prev) =>
        prev[id] ? { ...prev, [id]: { ...prev[id], x, y } } : prev,
      );

      return send("note:move", { id, x, y });
    },
    [send],
  );

  const updateNote = useCallback(
    (id, changes) => {
      setNotes((prev) =>
        prev[id] ? { ...prev, [id]: { ...prev[id], ...changes } } : prev,
      );

      return send("note:update", { id, ...changes });
    },
    [send],
  );

  const deleteNote = useCallback(
    (id) => {
      setNotes((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });

      return send("note:delete", { id });
    },
    [send],
  );

  return {
    status,
    error,
    you,
    room,
    notes,
    people,
    createNote,
    moveNote,
    updateNote,
    deleteNote,
  };
}
