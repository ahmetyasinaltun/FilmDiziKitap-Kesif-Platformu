import { Link } from 'react-router';
import { pageTitle } from '../lib/brand';

/** Henüz yapılmamış bölümler için geçici sayfa. */
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="perde-width page-gutter py-16">
      <title>{pageTitle(title)}</title>
      <h1 className="font-display text-[2.5rem] leading-tight">{title}</h1>
      <p className="mt-2 text-light-dim">Bu bölüm hazırlanıyor.</p>
      <Link to="/" className="mt-4 inline-block underline underline-offset-4">
        Ana sayfaya dön
      </Link>
    </div>
  );
}
