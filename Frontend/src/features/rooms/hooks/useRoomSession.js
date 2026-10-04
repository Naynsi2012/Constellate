import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "../../../lib/socket";
import { getColor, getHostToken, getUserId } from "../../../lib/identity";

export function useRoomSession(roomId, name) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [you, setYou] = useState(null);
  const [room, setRoom] = useState(null);
  const [notes, setNotes] = useState({});
  const [edges, setEdges] = useState({});
  const [people, setPeople] = useState({});

  const notesRef = useRef(notes);
  const edgesRef = useRef(edges);
  useEffect(() => {
    notesRef.current = notes;
    edgesRef.current = edges;
  }, [notes, edges]);

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
            setError(res?.error ?? "Could not join the room");
            setStatus("error");
            return;
          }

          const { notes, edges, participants, ...roomInfo } = res.state;
          setYou(res.you);
          setRoom(roomInfo);
          setNotes(notes);
          setEdges(edges ?? {});
          setPeople(participants);
          setStatus("joined");
        },
      );
    }

    const onNoteCreated = (note) => setNotes((prev) => ({ ...prev, [note.id]: note }));
    const onNoteChanged = (change) =>
      setNotes((prev) =>
        prev[change.id]
          ? { ...prev, [change.id]: { ...prev[change.id], ...change } }
          : prev,
      );

    const onNoteDeleted = ({ id }) => {
      setNotes((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
      setEdges((prev) => withoutEdgesOf(prev, id));
    };

    const onEdgeCreated = (edge) =>
      setEdges((prev) => ({ ...prev, [edge.id]: edge }));

    const onEdgeDeleted = ({ id }) =>
      setEdges((prev) => {
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
    socket.on("edge:created", onEdgeCreated);
    socket.on("edge:deleted", onEdgeDeleted);
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
      socket.off("edge:created", onEdgeCreated);
      socket.off("edge:deleted", onEdgeDeleted);
      socket.off("presence:join", onPresenceJoin);
      socket.disconnect();
    };
  }, [roomId, name]);

  const send = useCallback(
    (event, payload) =>
      new Promise((resolve) => socket.emit(event, payload, resolve)),
    [],
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
    async (id, changes) => {
      const before = notesRef.current[id];
      if (!before) return { ok: false, error: "note not found" };

      setNotes((prev) =>
        prev[id] ? { ...prev, [id]: { ...prev[id], ...changes } } : prev,
      );

      const res = await send("note:update", { id, ...changes });
      if (!res.ok) {
        const old = Object.fromEntries(
          Object.keys(changes).map((key) => [key, before[key]]),
        );
        setNotes((prev) =>
          prev[id] ? { ...prev, [id]: { ...prev[id], ...old } } : prev,
        );
      }

      return res;
    },
    [send],
  );

  const deleteNote = useCallback(
    async (id) => {
      const note = notesRef.current[id];
      if (!note) return { ok: false, error: "note not found" };
      const attached = Object.values(edgesRef.current).filter(
        (edge) => edge.source === id || edge.target === id,
      );

      setNotes((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
      setEdges((prev) => withoutEdgesOf(prev, id));

      const res = await send("note:delete", { id });
      if (!res.ok) {
        setNotes((prev) => ({ ...prev, [id]: note }));
        setEdges((prev) => ({
          ...prev,
          ...Object.fromEntries(attached.map((edge) => [edge.id, edge])),
        }));
      }

      return res;
    },
    [send],
  );

  const createEdge = useCallback(
    async (source, target) => {
      const already = Object.values(edgesRef.current).some(
        (edge) => edge.source === source && edge.target === target,
      );
      if (already) return { ok: false, error: "Already connected" };

      const res = await send("edge:create", { source, target });
      if (res.ok) setEdges((prev) => ({ ...prev, [res.edge.id]: res.edge }));

      return res;
    },
    [send],
  );

  const deleteEdge = useCallback(
    async (id) => {
      const edge = edgesRef.current[id];
      if (!edge) return { ok: false, error: "arrow not found" };

      setEdges((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });

      const res = await send("edge:delete", { id });
      if (!res.ok) setEdges((prev) => ({ ...prev, [id]: edge }));

      return res;
    },
    [send],
  );

  return {
    status,
    error,
    you,
    room,
    notes,
    edges,
    people,
    createNote,
    moveNote,
    updateNote,
    deleteNote,
    createEdge,
    deleteEdge,
  };
}

function withoutEdgesOf(edges, noteId) {
  return Object.fromEntries(
    Object.entries(edges).filter(
      ([, edge]) => edge.source !== noteId && edge.target !== noteId,
    ),
  );
}
