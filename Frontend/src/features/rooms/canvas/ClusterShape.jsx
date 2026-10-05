import { Circle, Group, Rect, Text } from "react-konva";

export default function ClusterShape({
  cluster,
  noteCount,
  voteCount,
  glow,
  selected,
  draggable,
  semantic, // true when zoomed out past the semantic threshold
  zoomScale,
  phase,
  onSelect,
  onVote,
  onRemoveVote,
  onRenameRequest,
  onDeleteRequest,
  onDragMoveCluster,
  onDragEndCluster,
}) {
  const hex = cluster.color ?? "#7aa2ff";

  const handleClick = (e) => {
    e.cancelBubble = true;
    onSelect(cluster.id);
    if (phase === "converge") onVote(cluster.id);
  };

  if (semantic) {
    const inv = 1 / (zoomScale || 1);
    const radius =
      Math.min(70 + 12 * Math.sqrt(Math.max(noteCount, 1)), 150) * inv;
    const cx = cluster.x + cluster.width / 2;
    const cy = cluster.y + cluster.height / 2;
    return (
      <Group
        x={cx}
        y={cy}
        onClick={handleClick}
        onTap={handleClick}
        onContextMenu={(e) => {
          e.evt.preventDefault();
          e.cancelBubble = true;
          if (phase === "converge") onRemoveVote(cluster.id);
        }}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = "pointer";
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = "default";
        }}
      >
        <Circle
          radius={radius}
          fill={`${hex}33`}
          stroke={hex}
          strokeWidth={(selected ? 3 : 1.5) * inv}
          shadowColor={glow > 0 ? "#ffd166" : hex}
          shadowBlur={(20 + glow * 60) * inv}
          shadowOpacity={0.5 + glow * 0.5}
        />
        <Text
          text={`${cluster.name.toUpperCase()}`}
          x={-radius}
          y={-14 * inv}
          width={radius * 2}
          align="center"
          fontSize={18 * inv}
          fontStyle="bold"
          fill="#f8fafc"
        />
        <Text
          text={`${noteCount} note${noteCount === 1 ? "" : "s"}${voteCount > 0 ? ` · ${voteCount} vote${voteCount === 1 ? "" : "s"}` : ""}`}
          x={-radius}
          y={10 * inv}
          width={radius * 2}
          align="center"
          fontSize={13 * inv}
          fill="#cbd5e1"
        />
      </Group>
    );
  }

  return (
    <Group
      x={cluster.x}
      y={cluster.y}
      draggable={draggable}
      onDragMove={(e) => onDragMoveCluster(cluster, e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEndCluster(cluster, e.target.x(), e.target.y())}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={(e) => {
        e.cancelBubble = true;
        onRenameRequest(cluster.id);
      }}
      onDblTap={(e) => {
        e.cancelBubble = true;
        onRenameRequest(cluster.id);
      }}
      onContextMenu={(e) => {
        e.evt.preventDefault();
        e.cancelBubble = true;
        if (phase === "converge") onRemoveVote(cluster.id);
      }}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (stage)
          stage.container().style.cursor = draggable ? "grab" : "pointer";
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "default";
      }}
    >
      <Rect
        width={cluster.width}
        height={cluster.height}
        fill={`${hex}14`}
        stroke={selected ? "#ffffff" : hex}
        strokeWidth={selected ? 2.5 : 1.5}
        dash={[8, 6]}
        cornerRadius={16}
        shadowColor={glow > 0 ? "#ffd166" : hex}
        shadowBlur={glow > 0 ? 10 + glow * 30 : 6}
        shadowOpacity={glow > 0 ? 0.3 + glow * 0.5 : 0.25}
      />
      <Text
        text={cluster.name.toUpperCase()}
        x={14}
        y={10}
        width={cluster.width - 28}
        fontSize={13}
        fontStyle="bold"
        letterSpacing={1.5}
        fill={hex}
      />
      <Text
        text={`${noteCount} note${noteCount === 1 ? "" : "s"}${voteCount > 0 ? ` · ${voteCount} vote${voteCount === 1 ? "" : "s"}` : ""}`}
        x={14}
        y={cluster.height - 22}
        width={cluster.width - 28}
        fontSize={11}
        fill="#94a3b8"
      />

      {/* delete handle */}
      {selected && phase === "cluster" && (
        <Group
          x={cluster.width - 6}
          y={6}
          onClick={(e) => {
            e.cancelBubble = true;
            onDeleteRequest(cluster.id);
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            onDeleteRequest(cluster.id);
          }}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = "pointer";
          }}
        >
          <Circle
            radius={10}
            fill="#0f172a"
            stroke="#ff7a90"
            strokeWidth={1.5}
          />
          <Text
            text="×"
            x={-10}
            y={-7}
            width={20}
            align="center"
            fontSize={13}
            fill="#ff7a90"
          />
        </Group>
      )}

      {/* vote badge */}
      {voteCount > 0 && (
        <Group x={cluster.width / 2} y={-8}>
          <Circle
            radius={13}
            fill="#ffd166"
            shadowColor="#ffd166"
            shadowBlur={8 + glow * 20}
            shadowOpacity={0.8}
            stroke="#0f172a"
            strokeWidth={1}
          />
          <Text
            text={String(voteCount)}
            x={-13}
            y={-6}
            width={26}
            align="center"
            fontSize={11}
            fontStyle="bold"
            fill="#0f172a"
          />
        </Group>
      )}
    </Group>
  );
}
