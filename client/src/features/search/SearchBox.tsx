import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { CloseIcon } from '../../components/icons';

/** Yazarken her harfte istek gitmesin; dış servislerin kotası ve yanıt süresi sınırlı. */
const DEBOUNCE_MS = 300;

/**
 * Arama metni adreste durur, böylece sonuç paylaşılabilir ve geri tuşu çalışır. Kutunun içeriği
 * ayrı tutulur: adres gecikmeli güncellendiği için doğrudan ona bağlansaydı yazılan harfler
 * kaybolurdu. Adresi kutu değil de başka bir şey değiştirdiyse (geri tuşu, menü) kutu ona uyar.
 */
export function SearchBox() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const input = useRef<HTMLInputElement>(null);
  const q = params.get('q') ?? '';

  const [draft, setDraft] = useState(q);
  const [seenKey, setSeenKey] = useState(location.key);
  if (location.key !== seenKey) {
    setSeenKey(location.key);
    if (!(location.state as { fromInput?: boolean } | null)?.fromInput) setDraft(q);
  }

  const commit = (value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set('q', value);
        else next.delete('q');
        return next;
      },
      { replace: true, state: { fromInput: true }, preventScrollReset: true },
    );
  };

  useEffect(() => {
    const value = draft.trim();
    if (value === q) return;
    const timer = setTimeout(() => commit(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    commit(draft.trim());
    // Telefonda klavye kapansın, sonuçlar görünsün.
    input.current?.blur();
  };

  return (
    <form role="search" action="/arama" onSubmit={onSubmit} className="relative">
      <label htmlFor="arama-kutusu" className="sr-only">
        Film, dizi, kişi ya da kitap ara
      </label>
      <input
        ref={input}
        id="arama-kutusu"
        type="search"
        name="q"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Film, dizi, kişi, kitap…"
        autoFocus={q === ''}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        className="search-input w-full border-b-2 border-light/40 bg-transparent pb-2 pr-12 font-display text-[2rem] leading-tight tracking-[-0.01em] transition-colors duration-200 placeholder:text-light-dim focus:border-film focus:outline-none sm:text-[2.75rem] lg:text-[3.25rem]"
      />
      {draft && (
        <button
          type="button"
          aria-label="Aramayı temizle"
          onClick={() => {
            setDraft('');
            input.current?.focus();
          }}
          className="pressable absolute right-0 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-light-dim hover:text-light"
        >
          <CloseIcon />
        </button>
      )}
    </form>
  );
}
