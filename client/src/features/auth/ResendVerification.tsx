import { smallQuietButton } from '../../components/button-styles';
import { useResendVerification } from './use-auth';

/** "Bağlantıyı tekrar gönder" düğmesi ve sonucu. Sonuç mesajı düğmenin altında, akışta durur. */
export function ResendVerification() {
  const resend = useResendVerification();

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => resend.mutate()}
        disabled={resend.isPending}
        className={smallQuietButton}
      >
        {resend.isPending ? 'Gönderiliyor…' : 'Bağlantıyı tekrar gönder'}
      </button>
      <p role="status" className="mt-3 min-h-6 text-light-dim">
        {resend.isSuccess && 'Yeni bağlantı gönderildi. Gelmezse gereksiz klasörüne de bak.'}
        {resend.error && <span className="text-alert">{resend.error.message}</span>}
      </p>
    </div>
  );
}
