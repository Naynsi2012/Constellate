import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Circle, Group, Rect, Text } from "react-konva";
import { FONTS } from "../noteStyles";
import { NOTE_WIDTH, NOTE_PAD } from "./constants";

const MIN_HEIGHT = 56;

export default function NoteShape({
  note,
  author,
  selected,
  draggable,
  voteCount,
  myVotes,
  glow,
  phase,
  linkActive,
  onMeasure,
  onSelect,
  onVote,
  onRemoveVote,
  onEditRequest,
  onDragStartNote,
  onDragMoveNote,
  onDragEndNote,
  onLinkStart,
  onLinkComplete,
  onHover,
}) {
  const textRef = useRef(null);
  const [textHeight, setTextHeight] = useState(40);
  const [hovered, setHovered] = useState(false);

  const isQuestion = note.type === "question";
  const width = NOTE_WIDTH;
  const height = Math.max(
    MIN_HEIGHT,
    textHeight + NOTE_PAD * 2 + (author ? 14 : 0) + (isQuestion ? 18 : 0),
  );

  useLayoutEffect(() => {
    const node = textRef.current;
    if (node) setTextHeight(node.height());
  }, [note.text, note.fontSize, note.fontFamily, width]);

  useEffect(() => {
    onMeasure(note.id, height);
  }, [note.id, height, onMeasure]);

  const font = {
    fontFamily: (FONTS[note.fontFamily] ?? FONTS.sans).css,
    fontSize: note.fontSize ?? 14,
  };

  const fill = isQuestion ? "#1e2a4a" : note.color;
  const textColor = isQuestion ? "#f8fafc" : "#0f172a";
  const strokeColor = selected
    ? "#ffffff"
    : glow > 0
      ? `rgba(255, 209, 102, ${0.35 + glow * 0.65})`
      : isQuestion
        ? "#ffd166"
        : "rgba(0,0,0,0.15)";

  return (
    <Group
      x={note.x}
      y={note.y}
      draggable={draggable}
      onDragStart={(e) => {
        e.cancelBubble = true;
        onDragStartNote(note);
      }}
      onDragMove={(e) => onDragMoveNote(note, e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEndNote(note, e.target.x(), e.target.y())}
      onClick={(e) => {
        e.cancelBubble = true;
        if (linkActive) {
          onLinkComplete(note.id);
          return;
        }
        onSelect(note.id);
        if (phase === "converge" && !isQuestion) onVote(note.id);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        if (linkActive) {
          onLinkComplete(note.id);
          return;
        }
        onSelect(note.id);
        if (phase === "converge" && !isQuestion) onVote(note.id);
      }}
      onDblClick={(e) => {
        e.cancelBubble = true;
        onEditRequest(note.id);
      }}
      onDblTap={(e) => {
        e.cancelBubble = true;
        onEditRequest(note.id);
      }}
      onContextMenu={(e) => {
        e.evt.preventDefault();
        e.cancelBubble = true;
        if (phase === "converge" && !isQuestion) onRemoveVote(note.id);
      }}
      onMouseDown={(e) => {
        if (linkActive) e.cancelBubble = true;
      }}
      onMouseEnter={(e) => {
        setHovered(true);
        onHover(note.id);
        const stage = e.target.getStage();
        if (stage)
          stage.container().style.cursor = linkActive
            ? "crosshair"
            : draggable
              ? "grab"
              : "pointer";
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        onHover(null);
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "default";
      }}
    >
      <Rect
        width={width}
        height={height}
        fill={fill}
        cornerRadius={10}
        stroke={strokeColor}
        strokeWidth={selected ? 2 : isQuestion ? 1.5 : glow > 0 ? 1.5 : 1}
        shadowColor={glow > 0 ? "#ffd166" : "black"}
        shadowBlur={glow > 0 ? 6 + glow * 26 : 10}
        shadowOpacity={glow > 0 ? 0.35 + glow * 0.6 : 0.35}
      />

      {isQuestion && (
        <Text
          text="✦ SESSION QUESTION"
          x={NOTE_PAD}
          y={7}
          width={width - NOTE_PAD * 2}
          fontSize={9}
          fontStyle="bold"
          letterSpacing={1}
          fill="#ffd166"
        />
      )}

      <Text
        ref={textRef}
        text={note.text || "…"}
        x={NOTE_PAD}
        y={NOTE_PAD + (isQuestion ? 14 : 0)}
        width={width - NOTE_PAD * 2}
        fill={textColor}
        fontFamily={font.fontFamily}
        fontSize={font.fontSize}
        lineHeight={1.3}
      />

      {author && (
        <Text
          text={author}
          x={NOTE_PAD}
          y={height - NOTE_PAD - 10}
          width={width - NOTE_PAD * 2}
          fontSize={10}
          fill={textColor}
          opacity={0.6}
        />
      )}

      {/* vote badge */}
      {voteCount > 0 && (
        <Group x={width - 4} y={-8}>
          <Circle
            radius={12}
            fill="#ffd166"
            shadowColor="#ffd166"
            shadowBlur={8 + glow * 20}
            shadowOpacity={0.8}
            stroke="#0f172a"
            strokeWidth={1}
          />
          <Text
            text={String(voteCount)}
            x={-12}
            y={-6}
            width={24}
            align="center"
            fontSize={11}
            fontStyle="bold"
            fill="#0f172a"
          />
        </Group>
      )}

      {/* my dots on this target */}
      {myVotes > 0 && (
        <Group x={10} y={-6}>
          {Array.from({ length: myVotes }).map((_, i) => (
            <Circle
              key={i}
              x={i * 10}
              radius={4}
              fill="#ffd166"
              stroke="#0f172a"
              strokeWidth={0.5}
            />
          ))}
        </Group>
      )}

      {/* connector handle: drag or click to link this note to another */}
      {(selected || hovered) && phase !== "converge" && !isQuestion && (
        <Circle
          x={width + 2}
          y={height / 2}
          radius={7}
          fill="#7aa2ff"
          stroke="#0f172a"
          strokeWidth={1.5}
          shadowColor="#7aa2ff"
          shadowBlur={8}
          onMouseDown={(e) => {
            e.cancelBubble = true;
            onLinkStart(note.id);
          }}
          onMouseUp={(e) => {
            if (linkActive) {
              e.cancelBubble = true;
              onLinkComplete(note.id);
            }
          }}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = "crosshair";
          }}
        />
      )}
    </Group>
  );
}
