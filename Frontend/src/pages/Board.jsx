import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useRoomSession } from "../features/rooms/hooks/useRoomSession";
import NamePrompt from "../features/rooms/components/NamePrompt";
import RoomHeader from "../features/rooms/components/RoomHeader";
import PhaseBar from "../features/rooms/components/PhaseBar";
import VoteHud from "../features/rooms/components/VoteHud";
import BoardCanvas from "../features/rooms/components/BoardCanvas";
import CommandPalette from "../features/rooms/components/CommandPalette";
import LobbyPrompt from "../features/rooms/components/LobbyPrompt";
import Toasts from "../features/rooms/components/Toasts";
import { getName, removeHostToken, saveName } from "../lib/identity";
import { PHASES } from "../features/rooms/socket/events";

const PAN_STEP = 80;

const isTypingTarget = (event) => {
  const el = event.target;
  return (
    el instanceof HTMLElement &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      el.isContentEditable)
  );
};

const Board = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState(getName());
  const session = useRoomSession(roomId, name);
  const { status, error, you, room, people, notes, edges, clusters, votes } =
    session;

  const [selection, setSelection] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [linkSourceId, setLinkSourceId] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const canvasApiRef = useRef(null);

  const handleSelect = useCallback((sel) => {
    setSelection(sel);
    if (!sel || sel.type !== "note") setEditingId(null);
  }, []);

  useEffect(() => {
    if (status === "error" && /not found/i.test(error ?? ""))
      removeHostToken(roomId);
  }, [status, error, roomId]);

  const orderedNoteIds = useMemo(
    () =>
      Object.values(notes)
        .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
        .map((n) => n.id),
    [notes],
  );

  const focusRelative = useCallback(
    (direction) => {
      if (orderedNoteIds.length === 0) return;
      const current =
        selection?.type === "note" ? orderedNoteIds.indexOf(selection.id) : -1;
      const next =
        (current + direction + orderedNoteIds.length) % orderedNoteIds.length;
      canvasApiRef.current?.focusNote(orderedNoteIds[next]);
    },
    [orderedNoteIds, selection],
  );

  const nextPhase = useCallback(() => {
    if (!room || !you?.isHost) return;
    const next = PHASES[PHASES.indexOf(room.phase) + 1];
    if (next) session.setPhase(next);
  }, [room, you, session]);

  const exportMarkdown = useCallback(() => {
    window.open(
      `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/export`,
      "_blank",
    );
  }, [roomId]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (paletteOpen) return; // the palette handles its own keys
      if (isTypingTarget(event)) return;

      if (mod && event.key === "Enter") {
        event.preventDefault();
        nextPhase();
        return;
      }
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) session.redo();
        else session.undo();
        return;
      }
      if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        session.redo();
        return;
      }

      const api = canvasApiRef.current;
      switch (event.key) {
        case "Escape":
          api?.escape();
          break;
        case "Tab":
          event.preventDefault();
          focusRelative(event.shiftKey ? -1 : 1);
          break;
        case "Enter":
          if (selection?.type === "note") {
            event.preventDefault();
            api?.editNote(selection.id);
          }
          break;
        case "Delete":
        case "Backspace":
          event.preventDefault();
          if (selection?.type === "note") {
            session.deleteNote(selection.id);
            setSelection(null);
          } else if (selection?.type === "edge") {
            session.deleteEdge(selection.id);
            setSelection(null);
          } else if (selection?.type === "cluster") {
            session.deleteCluster(selection.id);
            setSelection(null);
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          api?.panBy(0, PAN_STEP);
          break;
        case "ArrowDown":
          event.preventDefault();
          api?.panBy(0, -PAN_STEP);
          break;
        case "ArrowLeft":
          event.preventDefault();
          api?.panBy(PAN_STEP, 0);
          break;
        case "ArrowRight":
          event.preventDefault();
          api?.panBy(-PAN_STEP, 0);
          break;
        case "+":
        case "=":
          api?.zoomIn();
          break;
        case "-":
        case "_":
          api?.zoomOut();
          break;
        default: {
          const key = event.key.toLowerCase();
          if (key === "n" && room?.phase !== "converge") {
            api?.addNoteAtCenter();
          } else if (key === "l" && selection?.type === "note") {
            api?.startLinkFrom(selection.id);
          } else if (key === "v" && room?.phase === "converge" && selection) {
            if (selection.type === "note")
              session.addVote(selection.id, "note");
            if (selection.type === "cluster")
              session.addVote(selection.id, "cluster");
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paletteOpen, selection, room, session, focusRelative, nextPhase]);

  const commands = useMemo(() => {
    if (!room || !you) return [];
    const api = () => canvasApiRef.current;
    const list = [
      {
        label: "Create note",
        hint: "N",
        run: () => api()?.addNoteAtCenter(),
        show: room.phase !== "converge",
      },
      {
        label: "New cluster",
        run: () => api()?.createClusterAtCenter(),
        show: room.phase === "cluster",
      },
      {
        label: "Next phase",
        hint: "Ctrl+Enter",
        run: nextPhase,
        show: you.isHost && PHASES.indexOf(room.phase) < 2,
      },
      {
        label: "Previous phase",
        run: () => session.setPhase(PHASES[PHASES.indexOf(room.phase) - 1]),
        show: you.isHost && PHASES.indexOf(room.phase) > 0,
      },
      { label: "Zoom in", hint: "+", run: () => api()?.zoomIn() },
      { label: "Zoom out", hint: "−", run: () => api()?.zoomOut() },
      { label: "Fit everything on screen", run: () => api()?.fitView() },
      { label: "Focus next note", hint: "Tab", run: () => focusRelative(1) },
      {
        label: "Focus previous note",
        hint: "Shift+Tab",
        run: () => focusRelative(-1),
      },
      {
        label: "Create connector from selected note",
        hint: "L",
        run: () =>
          selection?.type === "note" && api()?.startLinkFrom(selection.id),
        show: selection?.type === "note" && room.phase !== "converge",
      },
      {
        label: "Vote for selected",
        hint: "V",
        run: () => {
          if (selection?.type === "note") session.addVote(selection.id, "note");
          if (selection?.type === "cluster")
            session.addVote(selection.id, "cluster");
        },
        show: room.phase === "converge" && !!selection,
      },
      {
        label: "Undo",
        hint: "Ctrl+Z",
        run: () => session.undo(),
        show: session.canUndo,
      },
      {
        label: "Redo",
        hint: "Ctrl+Shift+Z",
        run: () => session.redo(),
        show: session.canRedo,
      },
      {
        label: "Copy invite link",
        run: () =>
          navigator.clipboard?.writeText(window.location.href).catch(() => {}),
      },
      { label: "View results", run: () => navigate(`/room/${roomId}/results`) },
      { label: "Export Markdown", run: exportMarkdown },
    ];
    return list.filter((c) => c.show !== false);
  }, [
    room,
    you,
    selection,
    session,
    focusRelative,
    nextPhase,
    navigate,
    roomId,
    exportMarkdown,
  ]);

  if (!name) {
    return (
      <NamePrompt
        roomId={roomId}
        onSubmit={(chosen) => {
          saveName(chosen);
          setName(chosen);
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
        <p className="opacity-70">Connecting…</p>
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
      <PhaseBar room={room} you={you} session={session} />
      <div className="relative min-h-0 flex-1">
        <BoardCanvas
          session={session}
          you={you}
          selection={{
            noteId: selection?.type === "note" ? selection.id : null,
            edgeId: selection?.type === "edge" ? selection.id : null,
            clusterId: selection?.type === "cluster" ? selection.id : null,
          }}
          onSelect={handleSelect}
          editingId={editingId}
          setEditingId={setEditingId}
          linkSourceId={linkSourceId}
          setLinkSourceId={setLinkSourceId}
          canvasApiRef={canvasApiRef}
        />
        <VoteHud room={room} votes={votes} you={you} />
        {!room.question && (
          <LobbyPrompt
            isHost={you.isHost}
            onSubmit={(q) => session.setQuestion(q)}
          />
        )}
      </div>
      <Toasts toasts={session.toasts} onDismiss={session.dismissToast} />
      <CommandPalette
        open={paletteOpen}
        commands={commands}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
};

export default Board;
