import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { FONTS, FONT_SIZES, NOTE_COLORS } from "../noteStyles";

export default function NoteNode({ id, data, selected }) {
  const { canEdit, canDelete } = data;
  const [draft, setDraft] = useState(data.text);
  const focused = useRef(false);
  const areaRef = useRef(null);

  // Show edits that arrive from the server, unless it is being typed
  useEffect(() => {
    if (!focused.current) setDraft(data.text);
  }, [data.text]);

  useEffect(() => {
    if (!data.autoFocus) return;
    const timer = setTimeout(() => areaRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  // Grow the text area to fit the text and to follow font size or font changes
  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${area.scrollHeight}px`;
  }, [draft, data.fontSize, data.fontFamily]);

  const font = {
    fontFamily: (FONTS[data.fontFamily] ?? FONTS.sans).css,
    fontSize: `${data.fontSize}px`,
  };

  const sizeIndex = Math.max(0, FONT_SIZES.indexOf(data.fontSize));
  const smaller = FONT_SIZES[Math.max(0, sizeIndex - 1)];
  const bigger = FONT_SIZES[Math.min(FONT_SIZES.length - 1, sizeIndex + 1)];

  return (
    <div
      className="w-45 rounded-lg p-2 text-slate-900 shadow-lg"
      style={{
        background: data.color,
        outline: selected ? "2px solid white" : "none",
      }}
    >
      {/* Arrows: drag from the dot on the right of one note to the dot on the left of another */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {canEdit && (
        <div
          title="Drag here to move the note"
          className="-mx-2 -mt-2 mb-1 h-4 cursor-grab rounded-t-lg bg-black/10 text-center text-[10px] leading-4 tracking-widest text-slate-700/60"
        >
          ⋯⋯
        </div>
      )}

      {canEdit ? (
        <textarea
          ref={areaRef}
          className="nodrag nowheel block min-h-14 w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-slate-700/60"
          style={font}
          maxLength={500}
          placeholder="Type an idea…"
          value={draft}
          onFocus={() => {
            focused.current = true;
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            focused.current = false;
            if (draft !== data.text) data.onStyleChange(id, { text: draft }); // send once, when done typing
          }}
        />
      ) : (
        <p className="min-h-14 whitespace-pre-wrap wrap-break-word" style={font}>
          {data.text || "…"}
        </p>
      )}

      {data.author && (
        <div className="mt-1 text-[10px] text-slate-700/70">{data.author}</div>
      )}

      {selected && canEdit && (
        <div className="nodrag mt-2 flex flex-col gap-1.5">
          <div className="flex items-center gap-1">
            {NOTE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Colour ${color}`}
                className="size-4 rounded-full border border-black/20"
                style={{ background: color }}
                onClick={() => data.onStyleChange(id, { color })}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs">
            <select
              aria-label="Font"
              className="nowheel min-w-0 flex-1 rounded bg-black/10 px-1 py-0.5"
              value={data.fontFamily}
              onChange={(e) => data.onStyleChange(id, { fontFamily: e.target.value })}
            >
              {Object.entries(FONTS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Smaller text"
              disabled={smaller === data.fontSize}
              className="rounded bg-black/10 px-1.5 py-0.5 disabled:opacity-40"
              onClick={() => data.onStyleChange(id, { fontSize: smaller })}
            >
              A−
            </button>
            <button
              type="button"
              aria-label="Bigger text"
              disabled={bigger === data.fontSize}
              className="rounded bg-black/10 px-1.5 py-0.5 disabled:opacity-40"
              onClick={() => data.onStyleChange(id, { fontSize: bigger })}
            >
              A+
            </button>
            {canDelete && (
              <button
                type="button"
                aria-label="Delete note"
                className="rounded px-1.5 py-0.5 text-sm leading-none hover:bg-black/10"
                onClick={() => data.onDelete(id)}
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* The host can delete other people's notes, but not restyle them */}
      {selected && !canEdit && canDelete && (
        <div className="nodrag mt-2 flex justify-end">
          <button
            type="button"
            className="rounded bg-black/10 px-2 py-0.5 text-xs hover:bg-black/20"
            onClick={() => data.onDelete(id)}
          >
            Delete (host)
          </button>
        </div>
      )}
    </div>
  );
}