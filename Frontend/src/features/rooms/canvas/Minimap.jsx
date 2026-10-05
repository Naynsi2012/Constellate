import { useEffect, useRef } from "react";

const W = 172;
const H = 118;
const PAD = 40;

// Mini-map of the whole board, Click or drag to navigate
export default function Minimap({ notes, clusters, view, size, onNavigate }) {
  const canvasRef = useRef(null);
  const transformRef = useRef(null);
  const draggingRef = useRef(false);

  const computeTransform = () => {
    const items = [
      ...Object.values(notes).map((n) => ({ x: n.x, y: n.y, w: 180, h: 80 })),
      ...Object.values(clusters).map((c) => ({
        x: c.x,
        y: c.y,
        w: c.width,
        h: c.height,
      })),
    ];
    items.push({
      x: -view.x / view.scale,
      y: -view.y / view.scale,
      w: size.width / view.scale,
      h: size.height / view.scale,
    });

    if (items.length === 0) return null;
    const minX = Math.min(...items.map((i) => i.x)) - PAD;
    const minY = Math.min(...items.map((i) => i.y)) - PAD;
    const maxX = Math.max(...items.map((i) => i.x + i.w)) + PAD;
    const maxY = Math.max(...items.map((i) => i.y + i.h)) + PAD;
    const scale = Math.min(W / (maxX - minX), H / (maxY - minY));
    return { minX, minY, scale };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const t = computeTransform();
    transformRef.current = t;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    if (!t) return;

    const px = (x) => (x - t.minX) * t.scale;
    const py = (y) => (y - t.minY) * t.scale;

    for (const c of Object.values(clusters)) {
      ctx.fillStyle = `${c.color ?? "#7aa2ff"}2e`;
      ctx.strokeStyle = c.color ?? "#7aa2ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(px(c.x), py(c.y), c.width * t.scale, c.height * t.scale, 3);
      ctx.fill();
      ctx.stroke();
    }

    for (const n of Object.values(notes)) {
      ctx.fillStyle =
        n.type === "question" ? "#ffd166" : (n.color ?? "#ffd166");
      ctx.beginPath();
      ctx.arc(
        px(n.x) + 2,
        py(n.y) + 2,
        n.type === "question" ? 3.5 : 2.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // viewport rectangle
    const vx = px(-view.x / view.scale);
    const vy = py(-view.y / view.scale);
    const vw = (size.width / view.scale) * t.scale;
    const vh = (size.height / view.scale) * t.scale;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(vx, vy, vw, vh);
  }, [notes, clusters, view, size]);

  const navigate = (e) => {
    const t = transformRef.current;
    const canvas = canvasRef.current;
    if (!t || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const wx = (e.clientX - rect.left) / t.scale + t.minX;
    const wy = (e.clientY - rect.top) / t.scale + t.minY;
    onNavigate(wx, wy); // world point to center the viewport on
  };

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="cursor-crosshair rounded-lg border border-white/15 bg-slate-900/80 shadow-xl backdrop-blur"
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        navigate(e);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) navigate(e);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
    />
  );
}
