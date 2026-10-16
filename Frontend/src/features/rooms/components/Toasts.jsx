
export default function Toasts({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-4 sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:px-4 sm:pb-0">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => onDismiss(toast.id)}
          className={`pointer-events-auto flex min-h-11 w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-5 shadow-2xl shadow-black/25 backdrop-blur-xl transition-colors ${
            toast.kind === "info"
              ? "border-accent/30 bg-surface-raised/95 text-accent"
              : "border-danger/30 bg-surface-raised/95 text-danger"
          }`}
          aria-label={`Dismiss notification: ${toast.message}`}
        >
          <span
            className="mt-0.5 shrink-0 text-base"
            aria-hidden="true"
          >
            {toast.kind === "info" ? "ⓘ" : "!"}
          </span>

          <span className="min-w-0 flex-1 break-words">{toast.message}</span>

          <span className="shrink-0 text-xs opacity-60" aria-hidden="true">
            ✕
          </span>
        </button>
      ))}
    </div>
  );
}