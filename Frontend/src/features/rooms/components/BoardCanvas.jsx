import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import NoteNode from "./NoteNode";

const nodeTypes = { note: NoteNode };

const NOTE_WIDTH = 180;
const DRAG_SEND_MS = 60; // while dragging, tell the others about every 60ms not every pixels

// Pick a spot near a point where no existing note sits, so the "Add note" button doesn't pile notes on top of each other.
function findFreeSpot(point, notes) {
  const taken = Object.values(notes);
  const isFree = (x, y) =>
    taken.every(
      (n) => Math.abs(n.x - x) > NOTE_WIDTH + 20 || Math.abs(n.y - y) > 150,
    );
  const x0 = point.x - NOTE_WIDTH / 2;
  const y0 = point.y - 40;

  for (let ring = 0; ring < 12; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const x = x0 + dx * (NOTE_WIDTH + 30);
        const y = y0 + dy * 160;
        if (isFree(x, y)) return { x, y };
      }
    }
  }
  return { x: x0, y: y0 };
}

function Canvas({
  you,
  room,
  people,
  notes,
  edges,
  createNote,
  moveNote,
  updateNote,
  deleteNote,
  createEdge,
  deleteEdge,
}) {
  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef(null);
  const lastDragSend = useRef(0);
  const [nodes, setNodes] = useState([]);
  const [flowEdges, setFlowEdges] = useState([]);

  // In silent mode the notes are anonymous during the Diverge phase.
  const hideAuthors = room.silentMode && room.phase === "diverge";

  useEffect(() => {
    setNodes((prev) => {
      const prevById = new Map(prev.map((node) => [node.id, node]));

      return Object.values(notes).map((note) => {
        const old = prevById.get(note.id);
        const canEdit = note.authorId === you.userId; // only the author edits
        const canDelete = canEdit || you.isHost; // the host can also remove notes

        return {
          ...old, // keeps React Flow's own fields
          id: note.id,
          type: "note",
          deletable: canDelete,
          position: old?.dragging ? old.position : { x: note.x, y: note.y },
          data: {
            text: note.text,
            color: note.color,
            fontSize: note.fontSize ?? 14,
            fontFamily: note.fontFamily ?? "sans",
            canEdit,
            canDelete,
            author: hideAuthors
              ? null
              : (people[note.authorId]?.name ?? "Someone"),
            autoFocus:
              canEdit && !note.text && Date.now() - note.createdAt < 3000,
            onStyleChange: (id, changes) => updateNote(id, changes),
            onDelete: (id) => deleteNote(id),
          },
        };
      });
    });
  }, [notes, people, hideAuthors, you, updateNote, deleteNote]);

  useEffect(() => {
    setFlowEdges((prev) => {
      const prevById = new Map(prev.map((edge) => [edge.id, edge]));

      return Object.values(edges)
        .filter((edge) => notes[edge.source] && notes[edge.target])
        .map((edge) => ({
          ...prevById.get(edge.id), // keeps "selected"
          id: edge.id,
          source: edge.source,
          target: edge.target,
          markerEnd: { type: MarkerType.ArrowClosed },
          deletable: edge.authorId === you.userId || you.isHost,
        }));
    });
  }, [edges, notes, you]);

  const onNodesChange = useCallback(
    (changes) => setNodes((current) => applyNodeChanges(changes, current)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes) => setFlowEdges((current) => applyEdgeChanges(changes, current)),
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

  const onNodesDelete = useCallback(
    (deleted) => deleted.forEach((node) => deleteNote(node.id)),
    [deleteNote],
  );

  const onEdgesDelete = useCallback(
    (deleted) => deleted.forEach((edge) => deleteEdge(edge.id)),
    [deleteEdge],
  );

  // Dragging from one note's dot to another note's dot draws an arrow
  const onConnect = useCallback(
    (connection) => {
      if (
        connection.source &&
        connection.target &&
        connection.source !== connection.target
      ) {
        createEdge(connection.source, connection.target);
      }
    },
    [createEdge],
  );

  const addNoteAt = useCallback(
    (point) => createNote({ x: point.x - NOTE_WIDTH / 2, y: point.y - 40 }),
    [createNote],
  );

  // Double-click on the empty board creates a note there
  const onDoubleClick = useCallback(
    (event) => {
      if (!event.target.classList?.contains("react-flow__pane")) return; // ignore double-clicks on notes
      addNoteAt(screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [addNoteAt, screenToFlowPosition],
  );

  const addNoteAtCenter = () => {
    const box = wrapperRef.current.getBoundingClientRect();
    const center = screenToFlowPosition({
      x: box.left + box.width / 2,
      y: box.top + box.height / 2,
    });
    createNote(findFreeSpot(center, notes));
  };

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
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
        <Panel position="top-left">
          <p className="max-w-56 rounded bg-black/40 px-2 py-1 text-xs opacity-80">
            Double-click to add a note. Drag the dot on a note's right edge to
            another note to draw an arrow. Click an arrow or note and press
            Backspace to delete it.
          </p>
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
