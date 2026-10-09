export default function Toasts({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => onDismiss(toast.id)}
          className={`pointer-events-auto cursor-pointer rounded-lg border px-4 py-2 text-sm shadow-xl transition-colors ${
            toast.kind === "info"
              ? "border-accent/40 bg-surface-2 text-accent"
              : "border-danger/40 bg-surface-2 text-danger"
          }`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
