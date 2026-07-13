export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="border-2 border-danger bg-vc-soft px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-danger mb-1">
          The panel adjourned unexpectedly
        </p>
        <p className="font-mono text-sm text-ink-soft">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="shrink-0 px-4 py-2 border-2 border-danger text-danger font-mono text-xs uppercase tracking-wider hover:bg-danger hover:text-paper transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
      >
        Retry
      </button>
    </div>
  );
}
