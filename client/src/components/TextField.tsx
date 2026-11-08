import { useId, useState, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** Etiketli metin kutusu. Hata alanın altında yazar ve kutuya bağlanır, ekran okuyucu da duyar. */
export function TextField({ label, hint, error, type, ...input }: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-mesaj`;
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const message = error ?? hint;

  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          {...input}
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={`h-12 w-full border-b-2 bg-transparent text-lg transition-colors duration-200 focus:border-film focus:outline-none ${
            isPassword ? 'pr-20' : ''
          } ${error ? 'border-alert' : 'border-light/40'}`}
        />
        {isPassword && (
          <button
            type="button"
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
            className="absolute right-0 top-0 flex h-12 cursor-pointer items-center px-1 text-light-dim underline underline-offset-4 hover:text-light"
          >
            {visible ? 'Gizle' : 'Göster'}
          </button>
        )}
      </div>
      {message && (
        <p id={messageId} className={`mt-1 text-sm ${error ? 'text-alert' : 'text-light-dim'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
