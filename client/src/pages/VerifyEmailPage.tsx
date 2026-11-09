import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { filmButton } from '../components/button-styles';
import { ResendVerification } from '../features/auth/ResendVerification';
import { useSession, useVerifyEmail } from '../features/auth/use-auth';
import { ApiError } from '../lib/api';
import { pageTitle } from '../lib/brand';
import { safeNextPath } from '../lib/safe-path';

const textLink = 'inline-flex min-h-11 items-center underline underline-offset-4 hover:text-light';

/**
 * İki iş: e-postadaki bağlantı (`?kod=...`) hesabı doğrular; kodsuz adres kayıttan sonraki
 * "e-postanı kontrol et" ekranıdır. Bağlantı düğmeyle onaylanır, sayfa açılır açılmaz değil:
 * bazı e-posta servisleri güvenlik taraması için bağlantıları kullanıcıdan önce açar.
 */
export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const code = params.get('kod');
  const next = safeNextPath(params.get('next'));

  return code ? <ConfirmCode code={code} /> : <CheckInbox next={next} />;
}

function ConfirmCode({ code }: { code: string }) {
  const { user } = useSession();
  const verify = useVerifyEmail();

  // Süresi dolmuş, kullanılmış ya da bozuk kod (400): düğmeye tekrar basmak işe yaramaz,
  // sıradaki adım yeni bağlantı istemek. Ağ ya da sunucu hatasında düğme kalır.
  const invalid = verify.error instanceof ApiError && verify.error.status === 400;

  if (verify.isSuccess || (invalid && user?.emailVerified)) {
    return (
      <Layout
        title="E-postan doğrulandı"
        lead="Artık izlediklerini ve okuduklarını kaydedebilirsin."
      >
        <Link to="/" className={`${filmButton} mt-8 w-fit`}>
          Keşfetmeye başla
        </Link>
      </Layout>
    );
  }

  if (invalid) {
    return (
      <Layout title="Bağlantı geçersiz" lead={verify.error?.message}>
        {user ? (
          <ResendVerification />
        ) : (
          <Link to="/giris?next=%2Feposta-dogrula" className={`${filmButton} mt-8 w-fit`}>
            Yeni bağlantı için giriş yap
          </Link>
        )}
      </Layout>
    );
  }

  return (
    <Layout
      title="E-postanı doğrula"
      lead="Son adım: düğmeye bastığında hesabın doğrulanır ve kaydetmeye başlayabilirsin."
      focusTitle={false}
    >
      <button
        type="button"
        onClick={() => verify.mutate(code)}
        disabled={verify.isPending}
        className={`${filmButton} mt-8`}
      >
        {verify.isPending ? 'Doğrulanıyor…' : 'E-postamı doğrula'}
      </button>
      {verify.error && (
        <p role="alert" className="mt-6 text-alert">
          {verify.error.message}
        </p>
      )}
    </Layout>
  );
}

function CheckInbox({ next }: { next: string }) {
  const { user, isPending } = useSession();

  if (isPending) return <Layout title="E-posta doğrulama" />;

  if (!user) {
    return (
      <Layout
        title="E-posta doğrulama"
        lead="Doğrulama bağlantısını e-postandan aç. Yeni bir bağlantı istemek için önce giriş yap."
      >
        <Link to="/giris?next=%2Feposta-dogrula" className={`${filmButton} mt-8 w-fit`}>
          Giriş yap
        </Link>
      </Layout>
    );
  }

  if (user.emailVerified) {
    return (
      <Layout title="E-postan doğrulanmış" lead="Hesabın hazır; kaydetmeye başlayabilirsin.">
        <Link to={next} className={`${filmButton} mt-8 w-fit`}>
          Devam et
        </Link>
      </Layout>
    );
  }

  return (
    <Layout
      title="E-postanı kontrol et"
      lead={
        <>
          <span className="break-all text-light">{user.email}</span> adresine bir doğrulama
          bağlantısı gönderdik. Bağlantıyı açtıktan sonra izlediklerini ve okuduklarını
          kaydedebilirsin.
        </>
      }
    >
      <ResendVerification />
      <Link to={next} className={`${textLink} mt-4 text-light-dim`}>
        Şimdilik gezinmeye devam et
      </Link>
    </Layout>
  );
}

interface LayoutProps {
  title: string;
  lead?: ReactNode;
  /** Durum değişince odak başlığa gelir: ekran okuyucu yeni durumu duyar. */
  focusTitle?: boolean;
  children?: ReactNode;
}

function Layout({ title, lead, focusTitle = true, children }: LayoutProps) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusTitle) heading.current?.focus({ preventScroll: true });
  }, [focusTitle, title]);

  return (
    <div className="page-gutter mx-auto w-full max-w-md pt-6 sm:pt-14">
      <title>{pageTitle(title)}</title>
      <h1
        ref={heading}
        tabIndex={-1}
        className="font-display text-[2.5rem] leading-tight outline-none sm:text-[3.5rem]"
      >
        {title}
      </h1>
      {lead && <p className="mt-2 text-lg text-light-dim">{lead}</p>}
      {children}
    </div>
  );
}
