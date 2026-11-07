import { Link } from 'react-router';
import { pageTitle } from '../lib/brand';

export function NotFoundPage() {
  return (
    <div className="perde-width page-gutter py-16">
      <title>{pageTitle('Sayfa bulunamadı')}</title>
      <h1 className="font-display text-[2.5rem] leading-tight">Sayfa bulunamadı</h1>
      <p className="mt-2 text-light-dim">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <Link to="/" className="mt-4 inline-block underline underline-offset-4">
        Ana sayfaya dön
      </Link>
    </div>
  );
}
