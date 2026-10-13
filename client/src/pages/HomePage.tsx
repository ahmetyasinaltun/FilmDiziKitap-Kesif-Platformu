import { useHealth } from '../features/health/use-health';

/** Geçici ana sayfa: iskeletin uçtan uca çalıştığını gösterir. Faz 4'te yeniden tasarlanacak. */
export function HomePage() {
  const health = useHealth();

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Sosyal Kütüphane</h1>
      <p className="mt-2">v2 iskeleti</p>
      <p className="mt-4" role="status">
        API durumu:{' '}
        {health.isPending
          ? 'kontrol ediliyor...'
          : health.isError
            ? health.error.message
            : 'çalışıyor'}
      </p>
    </main>
  );
}
