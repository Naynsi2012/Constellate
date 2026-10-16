
import { useEffect, useMemo, useRef, useState } from "react";

export default function CommandPalette({ open, commands = [], onClose }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return commands.filter((command) => {
      const label = String(command?.label ?? "");
      const hint = String(command?.hint ?? "");

      return (
        label.toLowerCase().includes(q) ||
        hint.toLowerCase().includes(q)
      );
    });
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;

    setQuery("");
    setIndex(0);

    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || filtered.length === 0) return;

    itemRefs.current[index]?.scrollIntoView?.({
      block: "nearest",
      behavior: "smooth",
    });
  }, [index, filtered.length, open]);

  if (!open) return null;

  function run(command) {
    if (typeof command?.run !== "function") return;

    onClose?.();
    command.run();
  }

  function handleKeyDown(event) {
    event.stopPropagation();

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((current) =>
        filtered.length
          ? (current + 1) % filtered.length
          : 0,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((current) =>
        filtered.length
          ? (current - 1 + filtered.length) % filtered.length
          : 0,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(filtered[index]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/65 px-3 pb-5 pt-[max(1rem,7vh)] backdrop-blur-md sm:px-6 sm:pt-[12vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/40 sm:rounded-3xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-3 sm:px-5">
          <svg
            viewBox="0 0 24 24"
            className="size-5 shrink-0 text-faint"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4 4" />
          </svg>

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            aria-label="Search commands"
            aria-controls="command-palette-list"
            className="min-h-14 min-w-0 flex-1 bg-transparent py-4 text-base text-ink outline-none placeholder:text-faint sm:min-h-16 sm:text-sm"
          />

          <kbd className="hidden shrink-0 rounded-md border border-line bg-surface-raised px-1.5 py-1 text-[10px] text-faint sm:inline">
            ESC
          </kbd>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            {query.trim() ? "Search results" : "Available commands"}
          </p>

          <span className="text-xs tabular-nums text-faint">
            {filtered.length} {filtered.length === 1 ? "command" : "commands"}
          </span>
        </div>

        <ul
          id="command-palette-list"
          className="max-h-[min(55dvh,24rem)] overflow-y-auto p-2 sm:p-2.5"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-10 text-center">
              <div className="mx-auto mb-3 grid size-10 place-items-center rounded-xl border border-line bg-surface-raised text-faint">
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path d="m16 16 4 4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-ink">
                No matching commands
              </p>
              <p className="mt-1 text-xs text-faint">
                Try a different search term.
              </p>
            </li>
          ) : (
            filtered.map((command, i) => (
              <li key={command.id ?? command.label ?? i}>
                <button
                  ref={(element) => {
                    itemRefs.current[i] = element;
                  }}
                  type="button"
                  onClick={() => run(command)}
                  onMouseEnter={() => setIndex(i)}
                  aria-current={i === index ? "true" : undefined}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                    i === index
                      ? "bg-accent/10 text-accent"
                      : "text-dim hover:bg-surface-raised hover:text-ink"
                  }`}
                >
                  <span className="min-w-0 break-words font-medium">
                    {command.label}
                  </span>

                  {command.hint && (
                    <kbd className="shrink-0 rounded-md border border-line bg-canvas px-1.5 py-1 text-[10px] text-faint">
                      {command.hint}
                    </kbd>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-canvas/50 px-4 py-3 text-[10px] text-faint sm:px-5">
          <span className="hidden sm:inline">Navigate with ↑ ↓</span>
          <span className="sm:hidden">Tap a command to run it</span>
          <span className="hidden sm:inline">Run with Enter</span>
          <span className="sm:hidden">Esc to close</span>
        </div>
      </section>
    </div>
  );
}