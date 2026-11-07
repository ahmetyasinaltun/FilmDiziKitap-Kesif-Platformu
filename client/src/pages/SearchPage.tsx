import { useSearchParams } from 'react-router';
import { SearchBox } from '../features/search/SearchBox';
import { SearchResults } from '../features/search/SearchResults';
import { SearchTabs } from '../features/search/SearchTabs';
import { tabFromParam } from '../features/search/use-search';
import { pageTitle } from '../lib/brand';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const tab = tabFromParam(params.get('tur'));

  return (
    <div className="relative">
      <title>{pageTitle(q ? `${q} araması` : 'Arama')}</title>
      <div className="perde-width page-gutter pt-4 sm:pt-8">
        <h1 className="sr-only">Arama</h1>
        <SearchBox />
        <SearchTabs active={tab} />
        <div className="mt-6 sm:mt-8">
          <SearchResults q={q} tab={tab} />
        </div>
      </div>
    </div>
  );
}
