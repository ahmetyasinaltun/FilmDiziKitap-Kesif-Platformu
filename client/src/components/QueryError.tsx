interface QueryErrorProps {
  message: string;
  onRetry: () => void;
}

/** Veri alanı yüklenemediğinde satır içi mesaj; sayfanın geri kalanı çalışmaya devam eder. */
export function QueryError({ message, onRetry }: QueryErrorProps) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-4 text-light-dim">
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="pressable h-11 cursor-pointer rounded-full bg-light/10 px-5 font-medium text-light hover:bg-light/15"
      >
        Tekrar dene
      </button>
    </div>
  );
}
