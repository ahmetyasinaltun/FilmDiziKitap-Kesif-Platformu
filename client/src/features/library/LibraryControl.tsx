import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { activeButton, quietButton } from '../../components/button-styles';
import { CheckIcon } from '../../components/icons';
import { ApiError } from '../../lib/api';
import {
  contentPath,
  type ContentRef,
  type LibraryStatus,
  type MediaType,
} from '../../lib/content';
import { useSession } from '../auth/use-auth';
import { useLibraryEntry, useSaveEntry } from './use-library';

const LABELS: Record<MediaType, Record<LibraryStatus, string>> = {
  movie: { planned: 'İzleyeceğim', completed: 'İzledim' },
  tv: { planned: 'İzleyeceğim', completed: 'İzledim' },
  book: { planned: 'Okuyacağım', completed: 'Okudum' },
};

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function useLibrary(ref: ContentRef) {
  const { user } = useSession();
  const entry = useLibraryEntry(ref, user !== null);
  const save = useSaveEntry(ref);
  return { user, entry: entry.data ?? null, save };
}

/** Kaydetmeden önce yapılması gereken: ziyaretçi giriş yapar, yeni hesap e-postasını doğrular. */
type Need = 'login' | 'verify';

/** Sunucu da aynı şeyi söyleyebilir: oturum süresi dolmuşsa 401, doğrulanmamış hesapta 403. */
function needFromError(error: Error | null): Need | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 401) return 'login';
  if (error.code === 'EMAIL_NOT_VERIFIED') return 'verify';
  return null;
}

const noticeLink = 'underline underline-offset-4 hover:text-light';

function Notice({ need, error }: { need: Need | null; error: Error | null }) {
  const { pathname, search } = useLocation();
  const reason = need ?? needFromError(error);
  const back = encodeURIComponent(pathname + search);

  return (
    <p
      role="status"
      className="absolute left-0 top-full mt-1 whitespace-nowrap text-sm text-light-dim lg:left-auto lg:right-0"
    >
      {reason === 'login' ? (
        <>
          Kaydetmek için{' '}
          <Link to={`/giris?next=${back}`} className={noticeLink}>
            giriş yap
          </Link>
          .
        </>
      ) : reason === 'verify' ? (
        <>
          Kaydetmek için önce{' '}
          <Link to={`/eposta-dogrula?next=${back}`} className={noticeLink}>
            e-postanı doğrula
          </Link>
          .
        </>
      ) : (
        error && <span className="text-alert">{error.message}</span>
      )}
    </p>
  );
}

interface LibraryControlProps {
  type: MediaType;
  id: string;
  /** Vitrinde tek düğme; puan ve iki durum ayrıntı sayfasında */
  compact?: boolean;
  /** Kaydedilmemiş ilk düğmenin görünümü */
  idleClassName?: string;
}

export function LibraryControl({
  type,
  id,
  compact = false,
  idleClassName = quietButton,
}: LibraryControlProps) {
  const ref = { type, id };
  const { user, entry, save } = useLibrary(ref);
  const [need, setNeed] = useState<Need | null>(null);
  const labels = LABELS[type];

  const choose = (status: LibraryStatus) => {
    if (!user || !user.emailVerified) {
      setNeed(user ? 'verify' : 'login');
      return;
    }
    save.mutate({ status });
  };

  if (compact) {
    // Tamamlanmış kayıtta puan olabilir: vitrinde tek tıkla silinmesin, ayrıntıya götürür.
    if (entry?.status === 'completed') {
      return (
        <Link to={contentPath(type, id)} className={activeButton}>
          <CheckIcon />
          {labels.completed}
        </Link>
      );
    }

    const planned = entry?.status === 'planned';
    return (
      <div className="relative">
        <button
          type="button"
          aria-pressed={planned}
          onClick={() => (planned ? save.mutate(null) : choose('planned'))}
          className={planned ? activeButton : idleClassName}
        >
          {planned && <CheckIcon />}
          {labels.planned}
        </button>
        <Notice need={need} error={save.error} />
      </div>
    );
  }

  return (
    <div className="relative flex flex-wrap gap-3">
      {(['planned', 'completed'] as const).map((status, index) => {
        const selected = entry?.status === status;
        return (
          <button
            key={status}
            type="button"
            aria-pressed={selected}
            onClick={() => choose(status)}
            // Film rengi sadece hiç kayıt yokken ilk düğmede: kayıt varsa en dikkat çekici
            // düğme seçilmemiş seçenek olmasın.
            className={
              selected ? activeButton : index === 0 && !entry ? idleClassName : quietButton
            }
          >
            {selected && <CheckIcon />}
            {labels[status]}
          </button>
        );
      })}
      <Notice need={need} error={save.error} />
    </div>
  );
}

/** İzlenen ya da okunan içerik için puan ve kütüphaneden çıkarma. Ayrıntı sayfasında durur. */
export function LibraryRating({ type, id }: { type: MediaType; id: string }) {
  const ref = { type, id };
  const { entry, save } = useLibrary(ref);

  if (!entry) return null;

  return (
    <div className="mt-8 space-y-3">
      {entry.status === 'completed' && (
        <fieldset>
          <legend className="font-medium">Puanın</legend>
          <div className="mt-2 grid w-fit grid-cols-5 gap-2 sm:flex sm:gap-1">
            {SCORES.map((score) => {
              const selected = entry.rating === score;
              return (
                <label key={score} className="pressable block cursor-pointer">
                  <input
                    type="radio"
                    name="puan"
                    value={score}
                    checked={selected}
                    onChange={() => save.mutate({ status: 'completed', rating: score })}
                    // Seçili puana tekrar basmak puanı kaldırır.
                    onClick={() => {
                      if (selected) save.mutate({ status: 'completed', rating: null });
                    }}
                    className="peer sr-only"
                  />
                  <span
                    className={`grid size-10 place-items-center rounded-full font-medium tabular-nums transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-film ${
                      selected
                        ? 'bg-light font-bold text-room'
                        : 'bg-light/10 text-light hover:bg-light/15'
                    }`}
                  >
                    {score}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
      <button
        type="button"
        onClick={() => save.mutate(null)}
        className="flex h-11 cursor-pointer items-center text-light-dim underline underline-offset-4 hover:text-light"
      >
        Kütüphaneden çıkar
      </button>
    </div>
  );
}
