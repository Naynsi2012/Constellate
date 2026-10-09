import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Circle,
  Group,
  Line,
  Path,
  Rect,
  Text,
} from "react-konva";
import NoteShape from "../canvas/NoteShape";
import ClusterShape from "../canvas/ClusterShape";
import Minimap from "../canvas/Minimap";
import {
  NOTE_WIDTH,
  NOTE_PAD,
  SEMANTIC_ZOOM_THRESHOLD,
  MIN_ZOOM,
  MAX_ZOOM,
  canEditNote,
  canDeleteNote,
  canMoveNote,
  glowIntensity,
} from "../canvas/constants";
import { FONTS, NOTE_COLORS, FONT_SIZES } from "../noteStyles";
import ConnectorShape, {
  headData,
  quadCurveData,
  quadControl,
} from "../canvas/ConnectorShape";

const ACTIVE = "#818cf8";
const DRAG_SEND_MS = 60; // while dragging tell the others about every 60ms not every pixels
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Pick a spot near a point where no existing note sits, so notes don't pile up.
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

function makeStars(count) {
  const stars = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand() * 12000 - 6000,
      y: rand() * 12000 - 6000,
      r: 0.5 + rand() * 1.4,
      o: 0.15 + rand() * 0.6,
    });
  }
  return stars;
}

function NoteEditorOverlay({ note, view, onCommit, onCancel }) {
  const [draft, setDraft] = useState(note.text);
  const areaRef = useRef(null);

  useEffect(() => {
    const area = areaRef.current;
    if (area) {
      area.focus();
      area.select();
    }
  }, []);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${area.scrollHeight}px`;
  }, [draft]);

  const font = FONTS[note.fontFamily] ?? FONTS.sans;
  const left = note.x * view.scale + view.x + NOTE_PAD * view.scale;
  const top =
    note.y * view.scale +
    view.y +
    (NOTE_PAD + (note.type === "question" ? 14 : 0)) * view.scale;

  return (
    <textarea
      ref={areaRef}
      value={draft}
      maxLength={500}
      placeholder="Type an idea"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onCommit(draft);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      className="absolute z-20 resize-none overflow-hidden rounded bg-transparent font-medium outline-none ring-2 ring-accent/60"
      style={{
        left,
        top,
        width: (NOTE_WIDTH - NOTE_PAD * 2) * view.scale,
        fontSize: (note.fontSize ?? 14) * view.scale,
        fontFamily: font.css,
        color: note.type === "question" ? "#f8fafc" : "#0f172a",
        lineHeight: 1.3,
      }}
    />
  );
}

// Floating style toolbar above the selected note
function NoteToolbar({
  note,
  view,
  you,
  phase,
  myVotes,
  viewportWidth,
  onStyleChange,
  onDelete,
  onVote,
  onRemoveVote,
  onLinkStart,
}) {
  const canEdit = canEditNote(note, you, phase);
  const canDelete = canDeleteNote(note, you);
  const isQuestion = note.type === "question";
  const left = Math.max(
    8,
    Math.min(note.x * view.scale + view.x, viewportWidth - 380),
  );
  const top = note.y * view.scale + view.y;

  const sizeIndex = Math.max(0, FONT_SIZES.indexOf(note.fontSize ?? 14));
  const smaller = FONT_SIZES[Math.max(0, sizeIndex - 1)];
  const bigger = FONT_SIZES[Math.min(FONT_SIZES.length - 1, sizeIndex + 1)];

  const btn =
    "rounded-lg bg-surface-4 px-2 py-1 text-xs text-ink transition-colors hover:bg-surface-5 disabled:opacity-40";

  return (
    <div
      className="panel absolute z-20 flex -translate-y-full items-center gap-1 px-2 py-1.5 backdrop-blur"
      style={{ left, top: top - 8 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {phase === "converge" && !isQuestion ? (
        <>
          <button type="button" className={btn} onClick={() => onVote(note.id)}>
            Add dot
          </button>
          <button
            type="button"
            className={btn}
            disabled={myVotes === 0}
            onClick={() => onRemoveVote(note.id)}
          >
            Remove dot
          </button>
        </>
      ) : (
        <>
          {canEdit && !isQuestion && (
            <>
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Colour ${color}`}
                  className="size-4 cursor-pointer rounded-full border border-black/40 transition-transform hover:scale-110"
                  style={{ background: color }}
                  onClick={() => onStyleChange(note.id, { color })}
                />
              ))}
              <span className="mx-1 h-4 w-px bg-line" />
              <select
                aria-label="Font"
                className="cursor-pointer rounded-lg border border-line bg-surface-3 px-1 py-1 text-xs text-ink outline-none"
                value={note.fontFamily ?? "sans"}
                onChange={(e) =>
                  onStyleChange(note.id, { fontFamily: e.target.value })
                }
              >
                {Object.entries(FONTS).map(([key, { label }]) => (
                  <option key={key} value={key} className="text-slate-900">
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Smaller text"
                className={btn}
                disabled={smaller === note.fontSize}
                onClick={() => onStyleChange(note.id, { fontSize: smaller })}
              >
                A−
              </button>
              <button
                type="button"
                aria-label="Bigger text"
                className={btn}
                disabled={bigger === note.fontSize}
                onClick={() => onStyleChange(note.id, { fontSize: bigger })}
              >
                A+
              </button>
              <button
                type="button"
                title="Link to another note (L)"
                className={btn}
                onClick={() => onLinkStart(note.id)}
              >
                Link
              </button>
            </>
          )}
          {canEdit && isQuestion && (
            <span className="px-1 text-xs text-dim">
              Session question. Double-click to edit.
            </span>
          )}
          {canDelete && (
            <button
              type="button"
              title="Delete note"
              className={`${btn} text-danger! hover:bg-danger/15!`}
              onClick={() => onDelete(note.id)}
            >
              Delete
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function BoardCanvas({
  session,
  you,
  selection,
  onSelect,
  editingId,
  setEditingId,
  linkSourceId,
  setLinkSourceId,
  canvasApiRef,
}) {
  const { room, notes, edges, clusters, votes, people, cursors } = session;
  const phase = room.phase;

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const lastDragSend = useRef(0);
  const dragStart = useRef(null);
  const pinch = useRef({ dist: 0, center: null });

  const [size, setSize] = useState({ width: 1, height: 1 });
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [heights, setHeights] = useState({});
  const [, setHoveredId] = useState(null);
  const [linkPreview, setLinkPreview] = useState(null);
  const [renamingClusterId, setRenamingClusterId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");

  const stars = useMemo(() => makeStars(450), []);
  const semantic = view.scale < SEMANTIC_ZOOM_THRESHOLD;
  const hideAuthors = room.settings?.silentMode && phase === "diverge";

  const perNote = votes?.perNote ?? {};
  const perCluster = votes?.perCluster ?? {};

  const maxVotes = useMemo(
    () => Math.max(1, ...Object.values(perNote), ...Object.values(perCluster)),
    [perNote, perCluster],
  );

  const myVotes = useMemo(() => {
    const mine = {};
    for (const v of votes.mine)
      if (v.userId === you.userId)
        mine[v.targetId] = (mine[v.targetId] ?? 0) + 1;
    return mine;
  }, [votes.mine]);

  const clusterMembers = useMemo(() => {
    const counts = {};
    for (const note of Object.values(notes)) {
      if (note.clusterId)
        counts[note.clusterId] = (counts[note.clusterId] ?? 0) + 1;
    }
    return counts;
  }, [notes]);

  // viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    observer.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  // Center on the question note when the board first loads.
  const centeredOnce = useRef(false);
  useEffect(() => {
    if (centeredOnce.current || size.width <= 1) return;
    const anchor = Object.values(notes).find((n) => n.type === "question");
    const target = anchor ?? { x: 0, y: 0 };
    setView((v) => ({
      ...v,
      x: size.width / 2 - (target.x + NOTE_WIDTH / 2) * v.scale,
      y: size.height / 2 - (target.y + 40) * v.scale,
    }));
    centeredOnce.current = true;
  }, [notes, size]);

  const screenToCanvas = useCallback(
    (p, v = view) => ({ x: (p.x - v.x) / v.scale, y: (p.y - v.y) / v.scale }),
    [view],
  );

  const zoomAt = useCallback((screenPoint, factor) => {
    setView((prev) => {
      const scale = clamp(prev.scale * factor, MIN_ZOOM, MAX_ZOOM);
      const world = {
        x: (screenPoint.x - prev.x) / prev.scale,
        y: (screenPoint.y - prev.y) / prev.scale,
      };
      return {
        scale,
        x: screenPoint.x - world.x * scale,
        y: screenPoint.y - world.y * scale,
      };
    });
  }, []);

  const centerOn = useCallback(
    (wx, wy, scale = null) => {
      setView((prev) => {
        const s = scale ?? prev.scale;
        return {
          scale: s,
          x: size.width / 2 - wx * s,
          y: size.height / 2 - wy * s,
        };
      });
    },
    [size],
  );

  const fitView = useCallback(() => {
    const items = [
      ...Object.values(notes).map((n) => ({
        x: n.x,
        y: n.y,
        w: NOTE_WIDTH,
        h: heights[n.id] ?? 80,
      })),
      ...Object.values(clusters).map((c) => ({
        x: c.x,
        y: c.y,
        w: c.width,
        h: c.height,
      })),
    ];
    if (items.length === 0) return;
    const pad = 80;
    const minX = Math.min(...items.map((i) => i.x)) - pad;
    const minY = Math.min(...items.map((i) => i.y)) - pad;
    const maxX = Math.max(...items.map((i) => i.x + i.w)) + pad;
    const maxY = Math.max(...items.map((i) => i.y + i.h)) + pad;
    const scale = clamp(
      Math.min(size.width / (maxX - minX), size.height / (maxY - minY)),
      MIN_ZOOM,
      1.2,
    );
    setView({
      scale,
      x: size.width / 2 - ((minX + maxX) / 2) * scale,
      y: size.height / 2 - ((minY + maxY) / 2) * scale,
    });
  }, [notes, clusters, heights, size]);

  // note actions
  const createAndEdit = useCallback(
    async (pos) => {
      const res = await session.createNote(pos);
      if (res.ok) {
        onSelect({ type: "note", id: res.note.id });
        setEditingId(res.note.id);
      }
      return res;
    },
    [session, onSelect, setEditingId],
  );

  const addNoteAtCenter = useCallback(() => {
    const center = screenToCanvas({ x: size.width / 2, y: size.height / 2 });
    return createAndEdit(findFreeSpot(center, notes));
  }, [screenToCanvas, size, notes, createAndEdit]);

  const focusNote = useCallback(
    (id) => {
      const note = notes[id];
      if (!note) return;
      onSelect({ type: "note", id });
      centerOn(
        note.x + NOTE_WIDTH / 2,
        note.y + (heights[id] ?? 80) / 2,
        Math.max(view.scale, 0.8),
      );
    },
    [notes, heights, view.scale, onSelect, centerOn],
  );

  const editNote = useCallback(
    (id) => {
      const note = notes[id];
      if (note && canEditNote(note, you, phase)) setEditingId(id);
    },
    [notes, you, phase, setEditingId],
  );

  const createClusterAtCenter = useCallback(() => {
    const center = screenToCanvas({ x: size.width / 2, y: size.height / 2 });
    return session.createCluster({ x: center.x - 210, y: center.y - 150 });
  }, [screenToCanvas, size, session]);

  const escape = useCallback(() => {
    if (editingId) {
      setEditingId(null);
      return true;
    }
    if (renamingClusterId) {
      setRenamingClusterId(null);
      return true;
    }
    if (linkSourceId) {
      setLinkSourceId(null);
      setLinkPreview(null);
      return true;
    }
    if (selection.noteId || selection.edgeId || selection.clusterId) {
      onSelect(null);
      return true;
    }
    return false;
  }, [
    editingId,
    renamingClusterId,
    linkSourceId,
    selection,
    onSelect,
    setEditingId,
    setLinkSourceId,
  ]);

  // Expose the canvas API to the keyboard handler and the command palette
  useEffect(() => {
    canvasApiRef.current = {
      zoomIn: () => zoomAt({ x: size.width / 2, y: size.height / 2 }, 1.25),
      zoomOut: () => zoomAt({ x: size.width / 2, y: size.height / 2 }, 0.8),
      fitView,
      panBy: (dx, dy) => setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy })),
      addNoteAtCenter,
      focusNote,
      editNote,
      startLinkFrom: (id) => setLinkSourceId(id),
      createClusterAtCenter,
      escape,
      getScale: () => view.scale,
    };
  });

  // stage events
  const handleWheel = useCallback(
    (e) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;
      zoomAt(pointer, e.evt.deltaY < 0 ? 1.08 : 1 / 1.08);
    },
    [zoomAt],
  );

  const handleMouseMove = useCallback(() => {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const world = screenToCanvas(pointer);
    session.sendCursor(world.x, world.y);
    if (linkSourceId) setLinkPreview(world);
  }, [screenToCanvas, session, linkSourceId]);

  const handleStageMouseDown = useCallback(
    (e) => {
      if (e.target !== e.target.getStage()) return;
      if (linkSourceId) {
        setLinkSourceId(null);
        setLinkPreview(null);
        return;
      }
      onSelect(null);
    },
    [linkSourceId, onSelect, setLinkSourceId],
  );

  const handleStageMouseUp = useCallback(
    (e) => {
      if (linkSourceId && e.target === e.target.getStage()) {
        setLinkSourceId(null);
        setLinkPreview(null);
      }
    },
    [linkSourceId, setLinkSourceId],
  );

  const handleDoubleClick = useCallback(
    (e) => {
      if (e.target !== e.target.getStage()) return;
      if (phase === "converge") return;
      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;
      createAndEdit(findFreeSpot(screenToCanvas(pointer), notes));
    },
    [phase, createAndEdit, screenToCanvas, notes],
  );

  const handleTouchMove = useCallback((e) => {
    e.evt.preventDefault();
    const [t1, t2] = e.evt.touches;
    if (!t1 || !t2) return;
    const stage = stageRef.current;
    if (stage?.isDragging()) stage.stopDrag();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const p1 = { x: t1.clientX - rect.left, y: t1.clientY - rect.top };
    const p2 = { x: t2.clientX - rect.left, y: t2.clientY - rect.top };
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    const prev = pinch.current;
    if (!prev.dist) {
      pinch.current = { dist, center };
      return;
    }
    setView((v) => {
      const scale = clamp(v.scale * (dist / prev.dist), MIN_ZOOM, MAX_ZOOM);
      const world = {
        x: (prev.center.x - v.x) / v.scale,
        y: (prev.center.y - v.y) / v.scale,
      };
      return {
        scale,
        x: center.x - world.x * scale,
        y: center.y - world.y * scale,
      };
    });
    pinch.current = { dist, center };
  }, []);

  // note drag
  const throttledMove = useCallback(
    (id, x, y) => {
      const now = Date.now();
      if (now - lastDragSend.current < DRAG_SEND_MS) return;
      lastDragSend.current = now;
      session.moveNote(id, x, y);
    },
    [session],
  );

  const noteDrag = useMemo(
    () => ({
      onDragStartNote: (note) => {
        dragStart.current = { id: note.id, x: note.x, y: note.y };
        onSelect({ type: "note", id: note.id });
      },
      onDragMoveNote: (note, x, y) => throttledMove(note.id, x, y),
      onDragEndNote: (note, x, y) => {
        session.moveNote(note.id, x, y);
        if (dragStart.current?.id === note.id) {
          session.recordMove(
            note.id,
            { x: dragStart.current.x, y: dragStart.current.y },
            { x, y },
          );
          dragStart.current = null;
        }
      },
    }),
    [session, throttledMove, onSelect],
  );

  // Clusters move through their own event, with the same throttle as note drags
  const clusterDragMove = useCallback(
    (cluster, x, y) => {
      const now = Date.now();
      if (now - lastDragSend.current < DRAG_SEND_MS) return;
      lastDragSend.current = now;
      session.moveCluster(cluster.id, x, y);
    },
    [session],
  );

  const lastBendSend = useRef(0);
  const throttledBend = useCallback(
    (id, bend) => {
      const now = Date.now();
      if (now - lastBendSend.current < 90) return;
      lastBendSend.current = now;
      session.updateEdge(id, bend);
    },
    [session],
  );

  const completeLink = useCallback(
    (targetId) => {
      if (linkSourceId && linkSourceId !== targetId) {
        session.createEdge(linkSourceId, targetId, { silent: false });
      }
      setLinkSourceId(null);
      setLinkPreview(null);
    },
    [linkSourceId, session, setLinkSourceId],
  );

  const handleMeasure = useCallback((id, height) => {
    setHeights((prev) =>
      prev[id] === height ? prev : { ...prev, [id]: height },
    );
  }, []);

  // render helpers
  const noteList = Object.values(notes);
  const clusterList = Object.values(clusters);
  const edgeList = Object.values(edges).filter(
    (e) => notes[e.source] && notes[e.target],
  );
  const selectedNote = selection.noteId ? notes[selection.noteId] : null;
  const linkSource = linkSourceId ? notes[linkSourceId] : null;
  const editingNote = editingId ? notes[editingId] : null;

  const commitRename = () => {
    const name = renameDraft.trim();
    if (renamingClusterId && name)
      session.updateCluster(renamingClusterId, { name });
    setRenamingClusterId(null);
  };

  const renamingCluster = renamingClusterId
    ? clusters[renamingClusterId]
    : null;

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-slate-950"
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={view.x}
        y={view.y}
        scaleX={view.scale}
        scaleY={view.scale}
        draggable
        onDragStart={(e) => {
          if (e.target !== e.target.getStage()) e.target.getStage().stopDrag();
        }}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
          }
        }}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        onDblClick={handleDoubleClick}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => {
          pinch.current = { dist: 0, center: null };
        }}
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        {/* night sky */}
        <Layer listening={false}>
          {stars.map((s, i) => (
            <Circle
              key={i}
              x={s.x}
              y={s.y}
              radius={s.r}
              fill="#ffffff"
              opacity={s.o}
            />
          ))}
        </Layer>

        {/* clusters sit below notes */}
        <Layer>
          {clusterList.map((cluster) => (
            <ClusterShape
              key={cluster.id}
              cluster={cluster}
              noteCount={clusterMembers[cluster.id] ?? 0}
              voteCount={perCluster[cluster.id] ?? 0}
              glow={glowIntensity(perCluster[cluster.id] ?? 0, maxVotes)}
              selected={selection.clusterId === cluster.id}
              draggable={phase === "cluster"}
              semantic={semantic}
              zoomScale={view.scale}
              phase={phase}
              onSelect={(id) => onSelect({ type: "cluster", id })}
              onVote={(id) => session.addVote(id, "cluster")}
              onRemoveVote={(id) => session.removeVote(id)}
              onRenameRequest={(id) => {
                setRenamingClusterId(id);
                setRenameDraft(clusters[id]?.name ?? "");
              }}
              onDeleteRequest={(id) => session.deleteCluster(id)}
              onDragMoveCluster={clusterDragMove}
              onDragEndCluster={(cluster, x, y) =>
                session.moveCluster(cluster.id, x, y)
              }
            />
          ))}
        </Layer>

        {/* connectors */}
        {!semantic && (
          <Layer>
            {edgeList.map((edge) => (
              <ConnectorShape
                key={edge.id}
                edge={edge}
                source={notes[edge.source]}
                target={notes[edge.target]}
                sourceHeight={heights[edge.source] ?? 80}
                targetHeight={heights[edge.target] ?? 80}
                selected={selection.edgeId === edge.id}
                zoomScale={view.scale}
                onSelect={(id) => onSelect({ type: "edge", id })}
                onBend={throttledBend}
                onBendEnd={(id, bend) => session.updateEdge(id, bend)}
              />
            ))}

            {linkSource && linkPreview && (
              <>
                <Path
                  data={quadCurveData(
                    {
                      x: linkSource.x + NOTE_WIDTH,
                      y: linkSource.y + (heights[linkSource.id] ?? 80) / 2,
                    },
                    quadControl(
                      {
                        x: linkSource.x + NOTE_WIDTH,
                        y: linkSource.y + (heights[linkSource.id] ?? 80) / 2,
                      },
                      linkPreview,
                    ),
                    linkPreview,
                  )}
                  stroke={ACTIVE}
                  strokeWidth={1.75 / view.scale}
                  dash={[6 / view.scale, 4 / view.scale]}
                  lineCap="round"
                  listening={false}
                  perfectDrawEnabled={false}
                />
                <Path
                  data={headData(
                    linkPreview,
                    quadControl(
                      {
                        x: linkSource.x + NOTE_WIDTH,
                        y: linkSource.y + (heights[linkSource.id] ?? 80) / 2,
                      },
                      linkPreview,
                    ),
                    1 / view.scale,
                  )}
                  fill={ACTIVE}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              </>
            )}
          </Layer>
        )}

        {/* notes */}
        <Layer>
          {noteList.map((note) => {
            if (semantic) {
              // far view: notes become stars (counter-scaled to stay visible)
              const inv = 1 / view.scale;
              const glow = glowIntensity(perNote[note.id] ?? 0, maxVotes);
              const isQuestion = note.type === "question";
              return (
                <Circle
                  key={note.id}
                  x={note.x + NOTE_WIDTH / 2}
                  y={note.y + 40}
                  radius={(isQuestion ? 8 : 4) * inv}
                  fill={isQuestion ? "#ffd166" : note.color}
                  shadowColor={
                    isQuestion ? "#ffd166" : glow > 0 ? "#ffd166" : note.color
                  }
                  shadowBlur={(isQuestion ? 20 : 6 + glow * 20) * inv}
                  shadowOpacity={0.9}
                  listening={false}
                />
              );
            }

            return (
              <NoteShape
                key={note.id}
                note={note}
                author={
                  note.type === "question"
                    ? null
                    : hideAuthors
                      ? null
                      : (people[note.authorId]?.name ??
                        (note.authorId === you.userId ? "You" : null))
                }
                selected={selection.noteId === note.id}
                draggable={canMoveNote(note, you, phase)}
                voteCount={perNote[note.id] ?? 0}
                myVotes={myVotes[note.id] ?? 0}
                glow={glowIntensity(perNote[note.id] ?? 0, maxVotes)}
                phase={phase}
                linkActive={!!linkSourceId}
                onMeasure={handleMeasure}
                onSelect={(id) => onSelect({ type: "note", id })}
                onVote={(id) => session.addVote(id, "note")}
                onRemoveVote={(id) => session.removeVote(id)}
                onEditRequest={editNote}
                onDragStartNote={noteDrag.onDragStartNote}
                onDragMoveNote={noteDrag.onDragMoveNote}
                onDragEndNote={noteDrag.onDragEndNote}
                onLinkStart={(id) => setLinkSourceId(id)}
                onLinkComplete={completeLink}
                onHover={setHoveredId}
              />
            );
          })}
        </Layer>

        {/* live cursors */}
        <Layer listening={false}>
          {Object.entries(cursors)
            .filter(([userId]) => userId !== you.userId)
            .map(([userId, cursor]) => (
              <Group key={userId} x={cursor.x} y={cursor.y}>
                <CursorArrow color={cursor.color} />
                <Rect
                  x={10}
                  y={12}
                  width={cursor.name.length * 7 + 14}
                  height={18}
                  fill={cursor.color}
                  cornerRadius={9}
                  opacity={0.95}
                />
                <Text
                  x={10}
                  y={16}
                  width={cursor.name.length * 7 + 14}
                  align="center"
                  text={cursor.name}
                  fontSize={11}
                  fill="#0f172a"
                  fontStyle="bold"
                />
              </Group>
            ))}
        </Layer>
      </Stage>

      {/* HTML overlays (editors, toolbars, HUD) */}
      {editingNote && (
        <NoteEditorOverlay
          key={editingNote.id}
          note={editingNote}
          view={view}
          onCommit={(draft) => {
            if (draft !== editingNote.text)
              session.updateNote(editingNote.id, { text: draft });
            setEditingId(null);
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {selectedNote && !editingId && (
        <NoteToolbar
          note={selectedNote}
          view={view}
          you={you}
          phase={phase}
          myVotes={myVotes[selectedNote.id] ?? 0}
          onStyleChange={(id, changes) => session.updateNote(id, changes)}
          onDelete={(id) => {
            session.deleteNote(id);
            onSelect(null);
          }}
          onVote={(id) => session.addVote(id, "note")}
          onRemoveVote={(id) => session.removeVote(id)}
          onLinkStart={(id) => setLinkSourceId(id)}
          viewportWidth={size.width}
        />
      )}

      {renamingCluster && (
        <input
          autoFocus
          value={renameDraft}
          maxLength={60}
          onChange={(e) => setRenameDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setRenamingClusterId(null);
          }}
          className="absolute z-20 rounded-lg border border-line-strong bg-surface-2 px-2 py-1 text-sm font-semibold uppercase tracking-wider text-ink outline-none"
          style={{
            left: renamingCluster.x * view.scale + view.x + 14 * view.scale,
            top: renamingCluster.y * view.scale + view.y + 8 * view.scale,
            width: Math.max(
              160,
              renamingCluster.width * view.scale - 28 * view.scale,
            ),
          }}
        />
      )}

      {/* hint */}
      <div className="panel pointer-events-none absolute left-3 top-3 z-10 max-w-64 px-3 py-1.5 text-xs text-dim">
        {phase === "converge"
          ? "Click a note or cluster to drop a dot. Right-click takes one back."
          : phase === "cluster"
            ? "Drag notes together. Double-click empty space for a note, or create a cluster below."
            : "Double-click to add a note. Drag the blue dot on a note to link it. N for a new note, Ctrl+K for commands."}
      </div>

      {/* bottom-center actions */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {phase !== "converge" && (
          <button
            type="button"
            onClick={addNoteAtCenter}
            className="btn-primary rounded-full! shadow-lg px-2 text-sm"
          >
            Add note
          </button>
        )}
        {phase === "cluster" && (
          <button
            type="button"
            onClick={createClusterAtCenter}
            className="btn-ghost rounded-full! border-accent/40! bg-accent-soft! text-accent! shadow-lg hover:border-accent/60! px-2 text-sm"
          >
            New cluster
          </button>
        )}
        {linkSourceId && (
          <span className="chip px-4! py-2! text-ink! shadow-lg">
            Click a target note to connect. Esc to cancel.
          </span>
        )}
      </div>

      {/* zoom controls */}
      <div className="panel absolute right-3 bottom-4 z-10 flex flex-col gap-0.5 p-1">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() =>
            zoomAt({ x: size.width / 2, y: size.height / 2 }, 1.25)
          }
          className="grid size-8 place-items-center rounded-lg text-sm text-dim transition-colors hover:bg-surface-4 hover:text-ink"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => zoomAt({ x: size.width / 2, y: size.height / 2 }, 0.8)}
          className="grid size-8 place-items-center rounded-lg text-sm text-dim transition-colors hover:bg-surface-4 hover:text-ink"
        >
          -
        </button>
        <button
          type="button"
          aria-label="Fit board"
          onClick={fitView}
          title="Fit everything"
          className="grid size-8 place-items-center rounded-lg text-[11px] font-medium text-dim transition-colors hover:bg-surface-4 hover:text-ink"
        >
          Fit
        </button>
      </div>

      {/* minimap */}
      <div className="absolute bottom-4 left-3 z-10 hidden md:block">
        <Minimap
          notes={notes}
          clusters={clusters}
          view={view}
          size={size}
          onNavigate={(wx, wy) => centerOn(wx, wy)}
        />
      </div>
    </div>
  );
}

// Small cursor pointer shape for remote participants.
function CursorArrow({ color }) {
  return (
    <Line
      points={[0, 0, 0, 14, 4, 10.5, 6.5, 15.5, 8.5, 14.2, 6, 9.5, 10, 9.5]}
      fill={color}
      stroke="#0f172a"
      strokeWidth={0.5}
      closed
      lineJoin="round"
    />
  );
}
