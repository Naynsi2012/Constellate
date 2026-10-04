import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import NoteNode from "./NoteNode";

const nodeTypes = { note: NoteNode };

const NOTE_WIDTH = 180;
const DRAG_SEND_MS = 60; // while dragging, tell the others about every 60 ms and not on every pixels

function Canvas({
  you,
  room,
  people,
  notes,
  createNote,
  moveNote,
  updateNote,
  deleteNote,
}) {
  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef(null);
  const lastDragSend = useRef(0);
  const [nodes, setNodes] = useState([]);

  const hideAuthors = room.silentMode && room.phase === "diverge";

  useEffect(() => {
    setNodes((prev) => {
      const prevById = new Map(prev.map((node) => [node.id, node]));

      return Object.values(notes).map((note) => {
        const old = prevById.get(note.id);

        return {
          ...old, // keeps React Flow's own fields
          id: note.id,
          type: "note",
          position: old?.dragging ? old.position : { x: note.x, y: note.y },
          data: {
            text: note.text,
            color: note.color,
            author: hideAuthors
              ? null
              : (people[note.authorId]?.name ?? "Someone"),
            autoFocus:
              note.authorId === you.userId &&
              !note.text &&
              Date.now() - note.createdAt < 3000,
            onTextCommit: (id, text) => updateNote(id, { text }),
            onColorChange: (id, color) => updateNote(id, { color }),
            onDelete: (id) => deleteNote(id),
          },
        };
      });
    });
  }, [notes, people, hideAuthors, you.userId, updateNote, deleteNote]);

  const onNodesChange = useCallback(
    (changes) => setNodes((current) => applyNodeChanges(changes, current)),
    [],
  );

  const sendPositions = useCallback(
    (dragged) =>
      dragged.forEach((node) =>
        moveNote(node.id, node.position.x, node.position.y),
      ),
    [moveNote],
  );

  const onNodeDrag = useCallback(
    (_event, _node, dragged) => {
      const now = Date.now();
      if (now - lastDragSend.current < DRAG_SEND_MS) return;
      lastDragSend.current = now;
      sendPositions(dragged);
    },
    [sendPositions],
  );

  const onNodeDragStop = useCallback(
    (_event, _node, dragged) => sendPositions(dragged),
    [sendPositions],
  );

  // Backspace/Delete on a selected note (React Flow listens for the key itself)
  const onNodesDelete = useCallback(
    (deleted) => deleted.forEach((node) => deleteNote(node.id)),
    [deleteNote],
  );

  const addNoteAt = useCallback(
    (point) => createNote({ x: point.x - NOTE_WIDTH / 2, y: point.y - 40 }),
    [createNote],
  );

  // Double-click on the empty board creates a note there
  const onDoubleClick = useCallback(
    (event) => {
      if (!event.target.classList?.contains("react-flow__pane")) return;
      addNoteAt(screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [addNoteAt, screenToFlowPosition],
  );

  const addNoteAtCenter = () => {
    const box = wrapperRef.current.getBoundingClientRect();
    const jitter = () => (Math.random() - 0.5) * 80;
    addNoteAt(
      screenToFlowPosition({
        x: box.left + box.width / 2 + jitter(),
        y: box.top + box.height / 2 + jitter(),
      }),
    );
  };

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onDoubleClick={onDoubleClick}
        zoomOnDoubleClick={false}
        minZoom={0.1}
        maxZoom={2}
        colorMode="dark"
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
        <Panel position="bottom-center">
          <button
            type="button"
            onClick={addNoteAtCenter}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-lg hover:bg-slate-200"
          >
            + Add note
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function BoardCanvas(props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
