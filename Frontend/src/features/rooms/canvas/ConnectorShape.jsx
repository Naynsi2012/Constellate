import { Circle, Path } from "react-konva";
import { NOTE_WIDTH } from "./constants";

function anchors(source, sourceHeight, target, targetHeight) {
  const sc = { x: source.x + NOTE_WIDTH / 2, y: source.y + sourceHeight / 2 };
  const tc = { x: target.x + NOTE_WIDTH / 2, y: target.y + targetHeight / 2 };
  const dx = tc.x - sc.x;
  const dy = tc.y - sc.y;

  // Side-by-side notes connect left/right, stacked notes connect top/bottom
  const horizontal =
    Math.abs(dx) / NOTE_WIDTH >=
    Math.abs(dy) / ((sourceHeight + targetHeight) / 2);

  if (horizontal) {
    return dx >= 0
      ? {
          p0: { x: source.x + NOTE_WIDTH, y: sc.y },
          p1: { x: target.x, y: tc.y },
        }
      : {
          p0: { x: source.x, y: sc.y },
          p1: { x: target.x + NOTE_WIDTH, y: tc.y },
        };
  }
  return dy >= 0
    ? {
        p0: { x: sc.x, y: source.y + sourceHeight },
        p1: { x: tc.x, y: target.y },
      }
    : {
        p0: { x: sc.x, y: source.y },
        p1: { x: tc.x, y: target.y + targetHeight },
      };
}

function frame(p0, p1, bend) {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;

  const len = Math.hypot(dx, dy) || 1;

  const nx = -dy / len;
  const ny = dx / len;
  
  const b = bend ?? 0;

  return {
    c1: { x: p0.x + dx / 3 + nx * b, y: p0.y + dy / 3 + ny * b },
    c2: { x: p0.x + (2 * dx) / 3 + nx * b, y: p0.y + (2 * dy) / 3 + ny * b },
    nx,
    ny,
    len,
  };
}

// Stroke-only cubic curve
export function curvedCurveData(p0, c1, c2, p1) {
  return `M ${p0.x} ${p0.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p1.x} ${p1.y}`;
}

// Stroke-only quadratic curve (link preview)
export function quadCurveData(p0, c, p1) {
  return `M ${p0.x} ${p0.y} Q ${c.x} ${c.y} ${p1.x} ${p1.y}`;
}

export function quadControl(p0, p1, bow = 48) {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const b = Math.min(bow, len * 0.15);
  return {
    x: (p0.x + p1.x) / 2 + (dy / len) * b,
    y: (p0.y + p1.y) / 2 - (dx / len) * b,
  };
}

export function headData(p1, from, scale = 1) {
  const ux = p1.x - from.x;
  const uy = p1.y - from.y;
  const ul = Math.hypot(ux, uy) || 1;
  const dx = ux / ul;
  const dy = uy / ul;
  const L = 11 * scale;
  const W = 8.5 * scale;
  const bx = p1.x - dx * L;
  const by = p1.y - dy * L;
  const px = (-dy * W) / 2;
  const py = (dx * W) / 2;
  return `M ${p1.x} ${p1.y} L ${bx + px} ${by + py} L ${bx - px} ${by - py} Z`;
}

function midpoint(p0, c1, c2, p1) {
  return {
    x: (p0.x + 3 * c1.x + 3 * c2.x + p1.x) / 8,
    y: (p0.y + 3 * c1.y + 3 * c2.y + p1.y) / 8,
  };
}

const NORMAL = "#94a3b8";
const ACTIVE = "#818cf8";

export default function ConnectorShape({
  edge,
  source,
  target,
  sourceHeight,
  targetHeight,
  selected,
  zoomScale = 1,
  onSelect,
  onBend,
  onBendEnd,
}) {
  const inv = 1 / (zoomScale || 1);
  const { p0, p1 } = anchors(source, sourceHeight, target, targetHeight);
  const { c1, c2, nx, ny } = frame(p0, p1, edge.bend);
  const stroke = selected ? ACTIVE : NORMAL;

  const bendFromPointer = (pos) => {
    const bx = p0.x + (p1.x - p0.x) / 2;
    const by = p0.y + (p1.y - p0.y) / 2;
    return Math.round((pos.x - bx) * nx + (pos.y - by) * ny);
  };

  const handlePos = midpoint(p0, c1, c2, p1);

  return (
    <>
      {/* the visible line (stroke only not filled) */}
      <Path
        data={curvedCurveData(p0, c1, c2, p1)}
        stroke={stroke}
        strokeWidth={(selected ? 2.5 : 1.75) * inv}
        lineCap="round"
        opacity={selected ? 1 : 0.85}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        hitStrokeWidth={16 * inv}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect(edge.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect(edge.id);
        }}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = "pointer";
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = "default";
        }}
      />

      {/* the arrowhead (fill only) */}
      <Path
        data={headData(p1, c2, inv)}
        fill={stroke}
        listening={false}
        perfectDrawEnabled={false}
      />

      {selected && (
        <Circle
          x={handlePos.x}
          y={handlePos.y}
          radius={7 * inv}
          fill="#0b1120"
          stroke={ACTIVE}
          strokeWidth={2 * inv}
          perfectDrawEnabled={false}
          draggable
          onDragMove={(e) => {
            e.cancelBubble = true;
            onBend(edge.id, bendFromPointer(e.target.position()));
          }}
          onDragEnd={(e) => {
            e.cancelBubble = true;
            onBendEnd(edge.id, bendFromPointer(e.target.position()));
          }}
          onDblClick={(e) => {
            e.cancelBubble = true;
            onBendEnd(edge.id, undefined); // reset to default bow
          }}
          onDblTap={(e) => {
            e.cancelBubble = true;
            onBendEnd(edge.id, undefined);
          }}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = "grab";
          }}
        />
      )}
    </>
  );
}
