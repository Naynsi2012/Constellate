import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "../../../lib/socket";
import { getColor, getHostToken, getUserId } from "../../../lib/identity";
import { SOCKET_EVENTS as EV } from "../socket/events";

const CURSOR_SEND_MS = 50;
const CURSOR_TTL_MS = 8000;
const HISTORY_LIMIT = 100;
let toastSeq = 0;

export function useRoomSession(roomId, name) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [you, setYou] = useState(null);
  const [room, setRoom] = useState(null);
  const [notes, setNotes] = useState({});
  const [edges, setEdges] = useState({});
  const [clusters, setClusters] = useState({});
  const [votes, setVotes] = useState([]);
  const [people, setPeople] = useState({});
  const [cursors, setCursors] = useState({});
  const [toasts, setToasts] = useState([]);

  const notesRef = useRef(notes);
  const edgesRef = useRef(edges);
  const clustersRef = useRef(clusters);
  const peopleRef = useRef(people);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const lastCursorSend = useRef(0);
  const [, setHistoryVersion] = useState(0);

  useEffect(() => {
    notesRef.current = notes;
    edgesRef.current = edges;
    clustersRef.current = clusters;
    peopleRef.current = people;
  }, [notes, edges, clusters, people]);

  // toasts
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, kind = "error") => {
      const id = ++toastSeq;
      setToasts((prev) => [...prev.slice(-3), { id, message, kind }]);
      setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast],
  );

  const send = useCallback(
    (event, payload) =>
      new Promise((resolve) => {
        if (!socket.connected)
          return resolve({
            ok: false,
            code: "OFFLINE",
            error: "Not connected",
          });
        socket.emit(event, payload, resolve);
      }),
    [],
  );

  // A rejected command tells the user why (unless the caller handles it quietly).
  const checked = useCallback(
    async (event, payload, { silent = false } = {}) => {
      const res = await send(event, payload);
      if (!res?.ok && !silent) toast(res?.error ?? "That action was rejected");
      return res ?? { ok: false };
    },
    [send, toast],
  );

  // join + listeners
  useEffect(() => {
    if (!roomId || !name) return;
    setStatus("connecting");
    setError(null);

    const applyState = (state) => {
      const { notes, edges, clusters, votes, participants, ...roomInfo } =
        state;
      setRoom((prev) => {
        if (prev && prev.phase !== roomInfo.phase) {
          toast(`Phase changed: ${roomInfo.phase.toUpperCase()}`, "info");
        }
        return roomInfo;
      });
      setNotes(notes ?? {});
      setEdges(edges ?? {});
      setClusters(clusters ?? {});
      setVotes(votes ?? []);
      setPeople(participants ?? {});
    };

    function join() {
      socket.emit(
        EV.JOIN,
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
          setYou(res.you);
          applyState(res.state);
          setStatus("joined");
        },
      );
    }

    const onRoomState = (state) => applyState(state);

    const onNoteCreated = (note) =>
      setNotes((prev) => ({ ...prev, [note.id]: note }));
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
      setVotes((prev) =>
        prev.filter((v) => !(v.targetType === "note" && v.targetId === id)),
      );
    };

    const onEdgeCreated = (edge) =>
      setEdges((prev) => ({ ...prev, [edge.id]: edge }));
    const onEdgeDeleted = ({ id }) =>
      setEdges((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });

    const onClusterCreated = (cluster) =>
      setClusters((prev) => ({ ...prev, [cluster.id]: cluster }));
    const onClusterUpdated = (change) =>
      setClusters((prev) =>
        prev[change.id]
          ? { ...prev, [change.id]: { ...prev[change.id], ...change } }
          : prev,
      );
    const onClusterMoved = ({ id, x, y, notes: moved = [] }) => {
      setClusters((prev) =>
        prev[id] ? { ...prev, [id]: { ...prev[id], x, y } } : prev,
      );
      if (moved.length > 0) {
        setNotes((prev) => {
          const next = { ...prev };
          for (const m of moved) {
            if (next[m.id])
              next[m.id] = {
                ...next[m.id],
                x: m.x,
                y: m.y,
                clusterId: m.clusterId,
              };
          }
          return next;
        });
      }
    };
    const onClusterDeleted = ({ id, noteIds = [] }) => {
      setClusters((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
      setNotes((prev) => {
        const next = { ...prev };
        for (const noteId of noteIds) {
          if (next[noteId]) next[noteId] = { ...next[noteId], clusterId: null };
        }
        return next;
      });
      setVotes((prev) =>
        prev.filter((v) => !(v.targetType === "cluster" && v.targetId === id)),
      );
    };

    const onVoteAdded = (vote) => setVotes((prev) => [...prev, vote]);
    const onVoteRemoved = ({ id }) =>
      setVotes((prev) => prev.filter((v) => v.id !== id));

    const onSettings = ({ voteBudget }) =>
      setRoom((prev) =>
        prev ? { ...prev, settings: { ...prev.settings, voteBudget } } : prev,
      );
    const onTimer = ({ timer }) =>
      setRoom((prev) =>
        prev ? { ...prev, settings: { ...prev.settings, timer } } : prev,
      );
    const onQuestion = ({ question }) =>
      setRoom((prev) => (prev ? { ...prev, question } : prev));

    const onPresenceJoin = ({ userId, name, color }) =>
      setPeople((prev) => ({ ...prev, [userId]: { name, color } }));
    const onPresenceLeave = ({ userId }) => {
      setPeople((prev) => {
        const { [userId]: _removed, ...rest } = prev;
        return rest;
      });
      setCursors((prev) => {
        const { [userId]: _removed, ...rest } = prev;
        return rest;
      });
    };

    const onCursorMove = ({ userId, x, y }) => {
      const person = peopleRef.current[userId];
      setCursors((prev) => ({
        ...prev,
        [userId]: {
          x,
          y,
          name: person?.name ?? "Guest",
          color: person?.color ?? "#7aa2ff",
          ts: Date.now(),
        },
      }));
    };

    const onDisconnect = () => setStatus("connecting");

    socket.on("connect", join);
    socket.on("disconnect", onDisconnect);
    socket.on(EV.ROOM_STATE, onRoomState);
    socket.on(EV.NOTE_CREATED, onNoteCreated);
    socket.on(EV.NOTE_UPDATED, onNoteChanged);
    socket.on(EV.NOTE_MOVED, onNoteChanged);
    socket.on(EV.NOTE_DELETED, onNoteDeleted);
    socket.on(EV.EDGE_CREATED, onEdgeCreated);
    socket.on(EV.EDGE_DELETED, onEdgeDeleted);
    socket.on(EV.CLUSTER_CREATED, onClusterCreated);
    socket.on(EV.CLUSTER_UPDATED, onClusterUpdated);
    socket.on(EV.CLUSTER_MOVED, onClusterMoved);
    socket.on(EV.CLUSTER_DELETED, onClusterDeleted);
    socket.on(EV.VOTE_ADDED, onVoteAdded);
    socket.on(EV.VOTE_REMOVED, onVoteRemoved);
    socket.on(EV.SETTINGS_UPDATED, onSettings);
    socket.on(EV.TIMER_UPDATED, onTimer);
    socket.on(EV.QUESTION_UPDATED, onQuestion);
    socket.on(EV.PRESENCE_JOIN, onPresenceJoin);
    socket.on(EV.PRESENCE_LEAVE, onPresenceLeave);
    socket.on(EV.CURSOR_MOVE, onCursorMove);

    if (socket.connected) join();
    else socket.connect();

    return () => {
      socket.off("connect", join);
      socket.off("disconnect", onDisconnect);
      socket.off(EV.ROOM_STATE, onRoomState);
      socket.off(EV.NOTE_CREATED, onNoteCreated);
      socket.off(EV.NOTE_UPDATED, onNoteChanged);
      socket.off(EV.NOTE_MOVED, onNoteChanged);
      socket.off(EV.NOTE_DELETED, onNoteDeleted);
      socket.off(EV.EDGE_CREATED, onEdgeCreated);
      socket.off(EV.EDGE_DELETED, onEdgeDeleted);
      socket.off(EV.CLUSTER_CREATED, onClusterCreated);
      socket.off(EV.CLUSTER_UPDATED, onClusterUpdated);
      socket.off(EV.CLUSTER_MOVED, onClusterMoved);
      socket.off(EV.CLUSTER_DELETED, onClusterDeleted);
      socket.off(EV.VOTE_ADDED, onVoteAdded);
      socket.off(EV.VOTE_REMOVED, onVoteRemoved);
      socket.off(EV.SETTINGS_UPDATED, onSettings);
      socket.off(EV.TIMER_UPDATED, onTimer);
      socket.off(EV.QUESTION_UPDATED, onQuestion);
      socket.off(EV.PRESENCE_JOIN, onPresenceJoin);
      socket.off(EV.PRESENCE_LEAVE, onPresenceLeave);
      socket.off(EV.CURSOR_MOVE, onCursorMove);
      socket.disconnect();
    };
  }, [roomId, name]);

  // Drop cursors when the owner is idle or gone and stopped moving cursor
  useEffect(() => {
    const timer = setInterval(() => {
      const cutoff = Date.now() - CURSOR_TTL_MS;
      setCursors((prev) => {
        const next = Object.fromEntries(
          Object.entries(prev).filter(([, c]) => c.ts > cutoff),
        );
        return Object.keys(next).length === Object.keys(prev).length
          ? prev
          : next;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const record = useCallback((entry) => {
    undoStack.current.push(entry);
    if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
    redoStack.current = [];
    setHistoryVersion((v) => v + 1);
  }, []);

  const undo = useCallback(async () => {
    const entry = undoStack.current.pop();
    if (!entry) return;
    const res = await entry.undo();
    if (res?.ok === false) {
      undoStack.current.push(entry); // server rejected — put it back
      return;
    }
    redoStack.current.push(entry);
    setHistoryVersion((v) => v + 1);
  }, []);

  const redo = useCallback(async () => {
    const entry = redoStack.current.pop();
    if (!entry) return;
    const res = await entry.redo();
    if (res?.ok === false) {
      redoStack.current.push(entry);
      return;
    }
    undoStack.current.push(entry);
    setHistoryVersion((v) => v + 1);
  }, []);

  const createNote = useCallback(
    async (
      { id, x, y, text = "", color, fontSize, fontFamily },
      { record: shouldRecord = true } = {},
    ) => {
      const res = await checked(EV.NOTE_CREATE, {
        id,
        x,
        y,
        text,
        color,
        fontSize,
        fontFamily,
      });
      if (res.ok) {
        setNotes((prev) => ({ ...prev, [res.note.id]: res.note }));
        if (shouldRecord) {
          const note = res.note;
          record({
            label: "Create note",
            undo: () => deleteNote(note.id, { record: false }),
            redo: () => createNote(note, { record: false }),
          });
        }
      }
      return res;
    },
    [checked, record],
  );

  const moveNote = useCallback(
    async (id, x, y) => {
      setNotes((prev) =>
        prev[id] ? { ...prev, [id]: { ...prev[id], x, y } } : prev,
      );
      const res = await send(EV.NOTE_MOVE, { id, x, y });
      if (res?.ok && "clusterId" in res) {
        setNotes((prev) =>
          prev[id] && prev[id].clusterId !== res.clusterId
            ? { ...prev, [id]: { ...prev[id], clusterId: res.clusterId } }
            : prev,
        );
      }
      return res;
    },
    [send],
  );

  const recordMove = useCallback(
    (id, from, to) => {
      if (from.x === to.x && from.y === to.y) return;
      record({
        label: "Move note",
        undo: async () => {
          setNotes((prev) =>
            prev[id]
              ? { ...prev, [id]: { ...prev[id], x: from.x, y: from.y } }
              : prev,
          );
          return send(EV.NOTE_MOVE, { id, x: from.x, y: from.y });
        },
        redo: async () => {
          setNotes((prev) =>
            prev[id]
              ? { ...prev, [id]: { ...prev[id], x: to.x, y: to.y } }
              : prev,
          );
          return send(EV.NOTE_MOVE, { id, x: to.x, y: to.y });
        },
      });
    },
    [record, send],
  );

  const updateNote = useCallback(
    async (id, changes, { record: shouldRecord = true } = {}) => {
      const before = notesRef.current[id];
      if (!before) return { ok: false, error: "note not found" };

      setNotes((prev) =>
        prev[id] ? { ...prev, [id]: { ...prev[id], ...changes } } : prev,
      );

      const res = await checked(EV.NOTE_UPDATE, { id, ...changes });
      if (!res.ok) {
        const old = Object.fromEntries(
          Object.keys(changes).map((key) => [key, before[key]]),
        );
        setNotes((prev) =>
          prev[id] ? { ...prev, [id]: { ...prev[id], ...old } } : prev,
        );
      } else if (shouldRecord) {
        const oldChanges = Object.fromEntries(
          Object.keys(changes).map((key) => [key, before[key]]),
        );
        record({
          label: "Edit note",
          undo: () => updateNote(id, oldChanges, { record: false }),
          redo: () => updateNote(id, changes, { record: false }),
        });
      }

      return res;
    },
    [checked, record],
  );

  const deleteNote = useCallback(
    async (id, { record: shouldRecord = true } = {}) => {
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
      setVotes((prev) =>
        prev.filter((v) => !(v.targetType === "note" && v.targetId === id)),
      );

      const res = await checked(EV.NOTE_DELETE, { id });
      if (!res.ok) {
        setNotes((prev) => ({ ...prev, [id]: note }));
        setEdges((prev) => ({
          ...prev,
          ...Object.fromEntries(attached.map((edge) => [edge.id, edge])),
        }));
      } else if (shouldRecord) {
        record({
          label: "Delete note",
          undo: async () => {
            const res = await createNote(note, { record: false });
            if (!res.ok) return res;
            for (const edge of attached) {
              await createEdge(edge.source, edge.target, {
                id: edge.id,
                record: false,
              });
            }
            return res;
          },
          redo: () => deleteNote(id, { record: false }),
        });
      }

      return res;
    },
    [checked, record],
  );

  // Edges
  const createEdge = useCallback(
    async (
      source,
      target,
      { id, record: shouldRecord = true, silent = false } = {},
    ) => {
      const already = Object.values(edgesRef.current).some(
        (edge) => edge.source === source && edge.target === target,
      );
      if (already) return { ok: false, error: "Already connected" };

      const res = await checked(
        EV.EDGE_CREATE,
        { id, source, target },
        { silent },
      );
      if (res.ok) {
        setEdges((prev) => ({ ...prev, [res.edge.id]: res.edge }));
        if (shouldRecord) {
          const edge = res.edge;
          record({
            label: "Create connector",
            undo: () => deleteEdge(edge.id, { record: false }),
            redo: () =>
              createEdge(edge.source, edge.target, {
                id: edge.id,
                record: false,
              }),
          });
        }
      }
      return res;
    },
    [checked, record],
  );

  const deleteEdge = useCallback(
    async (id, { record: shouldRecord = true } = {}) => {
      const edge = edgesRef.current[id];
      if (!edge) return { ok: false, error: "arrow not found" };

      setEdges((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });

      const res = await checked(EV.EDGE_DELETE, { id });
      if (!res.ok) {
        setEdges((prev) => ({ ...prev, [id]: edge }));
      } else if (shouldRecord) {
        record({
          label: "Delete connector",
          undo: () =>
            createEdge(edge.source, edge.target, {
              id: edge.id,
              record: false,
            }),
          redo: () => deleteEdge(id, { record: false }),
        });
      }
      return res;
    },
    [checked, record], 
  );

  // clusters
  const createCluster = useCallback(
    async ({ x, y, name, width, height, color }) => {
      const res = await checked(EV.CLUSTER_CREATE, {
        x,
        y,
        name,
        width,
        height,
        color,
      });
      if (res.ok)
        setClusters((prev) => ({ ...prev, [res.cluster.id]: res.cluster }));
      return res;
    },
    [checked],
  );

  const updateCluster = useCallback(
    async (id, changes) => {
      const before = clustersRef.current[id];
      if (!before) return { ok: false, error: "cluster not found" };
      setClusters((prev) =>
        prev[id] ? { ...prev, [id]: { ...prev[id], ...changes } } : prev,
      );
      const res = await checked(EV.CLUSTER_UPDATE, { id, ...changes });
      if (!res.ok) {
        const old = Object.fromEntries(
          Object.keys(changes).map((key) => [key, before[key]]),
        );
        setClusters((prev) =>
          prev[id] ? { ...prev, [id]: { ...prev[id], ...old } } : prev,
        );
      }
      return res;
    },
    [checked],
  );

  const moveCluster = useCallback(
    (id, x, y) => {
      const before = clustersRef.current[id];
      if (!before) return Promise.resolve({ ok: false });
      const dx = x - before.x;
      const dy = y - before.y;
      setClusters((prev) =>
        prev[id] ? { ...prev, [id]: { ...prev[id], x, y } } : prev,
      );
      setNotes((prev) => {
        const next = { ...prev };
        for (const note of Object.values(next)) {
          if (note.clusterId === id)
            next[note.id] = { ...note, x: note.x + dx, y: note.y + dy };
        }
        return next;
      });
      return send(EV.CLUSTER_MOVE, { id, x, y });
    },
    [send],
  );

  const deleteCluster = useCallback(
    async (id) => {
      const before = clustersRef.current[id];
      if (!before) return { ok: false, error: "cluster not found" };
      setClusters((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
      const res = await checked(EV.CLUSTER_DELETE, { id });
      if (!res.ok) {
        setClusters((prev) => ({ ...prev, [id]: before }));
      }
      return res;
    },
    [checked],
  );

  // votes
  const addVote = useCallback(
    async (targetId, targetType = "note") => {
      const res = await checked(EV.VOTE_ADD, { targetId, targetType });
      if (res.ok) setVotes((prev) => [...prev, res.vote]);
      return res;
    },
    [checked],
  );

  const removeVote = useCallback(
    async (targetId) => {
      const res = await checked(EV.VOTE_REMOVE, { targetId }, { silent: true });
      if (res.ok) setVotes((prev) => prev.filter((v) => v.id !== res.vote.id));
      return res;
    },
    [checked],
  );

  // room control
  const setPhase = useCallback(
    (phase) => checked(EV.PHASE_CHANGE, { phase }),
    [checked],
  );
  const setQuestion = useCallback(
    (question) => checked(EV.ROOM_QUESTION, { question }),
    [checked],
  );
  const setVoteBudget = useCallback(
    (voteBudget) => checked(EV.SETTINGS_VOTE_BUDGET, { voteBudget }),
    [checked],
  );
  const timerStart = useCallback(
    (duration) => checked(EV.TIMER_START, duration ? { duration } : {}),
    [checked],
  );
  const timerPause = useCallback(() => checked(EV.TIMER_PAUSE, {}), [checked]);
  const timerReset = useCallback(() => checked(EV.TIMER_RESET, {}), [checked]);

  const sendCursor = useCallback((x, y) => {
    const now = Date.now();
    if (now - lastCursorSend.current < CURSOR_SEND_MS) return;
    lastCursorSend.current = now;
    socket.volatile.emit(EV.CURSOR_MOVE, { x, y });
  }, []);

  return {
    status,
    error,
    you,
    room,
    notes,
    edges,
    clusters,
    votes,
    people,
    cursors,
    toasts,
    dismissToast,
    toast,
    createNote,
    moveNote,
    recordMove,
    updateNote,
    deleteNote,
    createEdge,
    deleteEdge,
    createCluster,
    updateCluster,
    moveCluster,
    deleteCluster,
    addVote,
    removeVote,
    setPhase,
    setQuestion,
    setVoteBudget,
    timerStart,
    timerPause,
    timerReset,
    sendCursor,
    undo,
    redo,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  };
}

function withoutEdgesOf(edges, noteId) {
  return Object.fromEntries(
    Object.entries(edges).filter(
      ([, edge]) => edge.source !== noteId && edge.target !== noteId,
    ),
  );
}
