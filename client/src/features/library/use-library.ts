import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type {
  ContentRef,
  LibraryEntry,
  LibraryItem,
  LibraryStatus,
  MediaType,
  Paginated,
} from '../../lib/content';

interface EntryResponse {
  entry: LibraryEntry | null;
}

type EntryInput = { status: LibraryStatus; rating?: number | null };

const entryKey = ({ type, id }: ContentRef) => ['library', 'entry', type, id];
const entryUrl = ({ type, id }: ContentRef) => `/library/${type}/${encodeURIComponent(id)}`;

export function useLibraryEntry(ref: ContentRef, enabled: boolean) {
  return useQuery({
    queryKey: entryKey(ref),
    queryFn: () => apiFetch<EntryResponse>(entryUrl(ref)),
    select: (data) => data.entry,
    enabled,
  });
}

/** Sonucu sunucuyu beklemeden gösterir; `null` kayıt silindi demektir. */
function optimisticEntry(
  previous: LibraryEntry | null,
  input: EntryInput | null,
): LibraryEntry | null {
  if (!input) return null;
  const rating =
    input.status === 'planned'
      ? null
      : input.rating !== undefined
        ? input.rating
        : previous?.rating;
  return {
    status: input.status,
    rating: rating ?? null,
    finishedAt: previous?.finishedAt ?? null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Kaydet ya da sil (`null`). İlk eklemede sunucu içeriği sağlayıcıdan doğruladığı için yanıt
 * yaklaşık bir saniye sürebilir: düğme hemen değişir, hata olursa eski haline döner.
 */
export function useSaveEntry(ref: ContentRef) {
  const client = useQueryClient();
  const key = entryKey(ref);

  return useMutation({
    mutationFn: async (input: EntryInput | null) => {
      if (input) {
        await apiFetch<EntryResponse>(entryUrl(ref), {
          method: 'PUT',
          body: JSON.stringify(input),
        });
      } else {
        await apiFetch<null>(entryUrl(ref), { method: 'DELETE' });
      }
    },
    onMutate: async (input) => {
      // Yoldaki eski yanıt iyimser değerin üstüne yazmasın.
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<EntryResponse>(key);
      client.setQueryData<EntryResponse>(key, {
        entry: optimisticEntry(previous?.entry ?? null, input),
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      client.setQueryData(key, context?.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['library'] }),
  });
}

interface LibraryFilter {
  type?: MediaType;
  status?: LibraryStatus;
}

export function useLibraryList(username: string, filter: LibraryFilter) {
  return useInfiniteQuery({
    queryKey: ['library', 'list', username, filter],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam) });
      if (filter.type) params.set('type', filter.type);
      if (filter.status) params.set('status', filter.status);
      return apiFetch<Paginated<LibraryItem>>(
        `/users/${encodeURIComponent(username)}/library?${params}`,
      );
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}
