import { smallQuietButton } from './button-styles';

interface QueryErrorProps {
  message: string;
  onRetry: () => void;
}

/** Veri alanı yüklenemediğinde satır içi mesaj; sayfanın geri kalanı çalışmaya devam eder. */
export function QueryError({ message, onRetry }: QueryErrorProps) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-4 text-light-dim">
      <p>{message}</p>
      <button type="button" onClick={onRetry} className={smallQuietButton}>
        Tekrar dene
      </button>
    </div>
  );
}
