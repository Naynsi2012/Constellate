import { useEffect, useRef, useState } from "react";

const COLORS = [
  "#ffd166",
  "#ff9f68",
  "#ff7a90",
  "#c4a1ff",
  "#6ee7b7",
  "#7aa2ff",
];

export default function NoteNode({ id, data, selected }) {
  const [draft, setDraft] = useState(data.text);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(data.text);
  }, [data.text]);

  return (
    <div
      className="w-45 rounded-lg p-2 text-slate-900 shadow-lg"
      style={{
        background: data.color,
        outline: selected ? "2px solid white" : "none",
      }}
    >
      <textarea
        className="nodrag nowheel w-full resize-none bg-transparent text-sm outline-none placeholder:text-slate-700/60"
        rows={3}
        maxLength={500}
        placeholder="Type an idea…"
        value={draft}
        autoFocus={data.autoFocus}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          focused.current = false;
          if (draft !== data.text) data.onTextCommit(id, draft);
        }}
      />

      {data.author && (
        <div className="mt-1 text-[10px] text-slate-700/70">{data.author}</div>
      )}

      {selected && (
        <div className="nodrag mt-2 flex items-center gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Colour ${color}`}
              className="size-4 rounded-full border border-black/20"
              style={{ background: color }}
              onClick={() => data.onColorChange(id, color)}
            />
          ))}
          <button
            type="button"
            aria-label="Delete note"
            className="ml-auto rounded px-1 text-sm leading-none hover:bg-black/10"
            onClick={() => data.onDelete(id)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
