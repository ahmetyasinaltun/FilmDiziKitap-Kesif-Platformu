import { useState } from 'react';
import { Link } from 'react-router';

interface LibraryButtonProps {
  label: string;
  className: string;
}

/** Kütüphaneye ekleme. Mesaj akış dışında durur: görününce alttaki sıra yerinden oynamaz. */
export function LibraryButton({ label, className }: LibraryButtonProps) {
  const [notice, setNotice] = useState(false);

  return (
    <div className="relative">
      <button type="button" onClick={() => setNotice(true)} className={className}>
        {label}
      </button>
      <p
        role="status"
        className="absolute left-0 top-full mt-1 whitespace-nowrap text-sm text-light-dim lg:left-auto lg:right-0"
      >
        {notice && (
          <>
            Kaydetmek için{' '}
            <Link to="/giris" className="underline underline-offset-4 hover:text-light">
              giriş yap
            </Link>
            .
          </>
        )}
      </p>
    </div>
  );
}
