export default function Toasts({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => onDismiss(toast.id)}
          className={`pointer-events-auto rounded-lg px-4 py-2 text-sm shadow-xl ${
            toast.kind === "info"
              ? "border border-indigo-400/40 bg-indigo-950/95 text-indigo-200"
              : "border border-rose-400/40 bg-rose-950/95 text-rose-200"
          }`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
