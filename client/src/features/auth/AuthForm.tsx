import { useEffect, useRef, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { filmButton } from '../../components/button-styles';
import { TextField } from '../../components/TextField';
import { ApiError } from '../../lib/api';
import { useAuthForm } from './use-auth';

type Mode = 'login' | 'register';

const FORMS = {
  login: {
    submit: 'Giriş yap',
    pending: 'Giriş yapılıyor…',
    switchText: 'Hesabın yok mu?',
    switchLabel: 'Kayıt ol',
    switchPath: '/kayit',
    fields: [
      {
        name: 'identifier',
        label: 'Kullanıcı adı veya e-posta',
        autoComplete: 'username',
        type: 'text',
      },
      { name: 'password', label: 'Şifre', autoComplete: 'current-password', type: 'password' },
    ],
  },
  register: {
    submit: 'Hesap oluştur',
    pending: 'Hesap oluşturuluyor…',
    switchText: 'Hesabın var mı?',
    switchLabel: 'Giriş yap',
    switchPath: '/giris',
    fields: [
      {
        name: 'username',
        label: 'Kullanıcı adı',
        autoComplete: 'username',
        type: 'text',
        hint: '3-20 karakter; harf, rakam ve alt çizgi.',
      },
      { name: 'email', label: 'E-posta', autoComplete: 'email', type: 'email' },
      {
        name: 'password',
        label: 'Şifre',
        autoComplete: 'new-password',
        type: 'password',
        hint: 'En az 8 karakter.',
      },
    ],
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const form = FORMS[mode];
  const auth = useAuthForm(mode === 'login' ? 'login' : 'register');
  const [params] = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const fieldErrors = auth.error instanceof ApiError ? auth.error.fields : undefined;
  const hasFieldError = form.fields.some((field) => fieldErrors?.[field.name]?.[0]);
  const generalError = auth.error && !hasFieldError ? auth.error.message : null;

  // Hatalı alana odaklan: klavye ve ekran okuyucu kullanan kişi sorunu hemen bulsun.
  useEffect(() => {
    if (!auth.isError) return;
    formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
  }, [auth.isError]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    // Oturum açılınca sayfa kendiliğinden yönlendirir (AuthPage).
    auth.mutate(body);
  };

  return (
    <>
      <form
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        onChange={() => {
          if (auth.isError) auth.reset();
        }}
        className="mt-8 space-y-6"
      >
        {form.fields.map((field) => (
          <TextField
            key={field.name}
            required
            autoCapitalize="none"
            spellCheck={false}
            {...field}
            error={fieldErrors?.[field.name]?.[0]}
          />
        ))}

        {generalError && (
          <p role="alert" className="text-alert">
            {generalError}
          </p>
        )}

        <button type="submit" disabled={auth.isPending} className={`${filmButton} w-full`}>
          {auth.isPending ? form.pending : form.submit}
        </button>
      </form>

      <p className="mt-6 text-light-dim">
        {form.switchText}{' '}
        <Link
          to={{ pathname: form.switchPath, search: params.toString() }}
          replace
          className="text-light underline underline-offset-4 hover:no-underline"
        >
          {form.switchLabel}
        </Link>
      </p>
    </>
  );
}
