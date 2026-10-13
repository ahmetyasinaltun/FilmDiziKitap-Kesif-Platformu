import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Sayfa bulunamadı</h1>
      <p className="mt-2">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <Link to="/" className="mt-4 inline-block underline">
        Ana sayfaya dön
      </Link>
    </main>
  );
}
