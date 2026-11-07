import { Link, useSearchParams } from 'react-router';
import { pillLink } from '../../components/button-styles';
import { SEARCH_TABS, type SearchTab } from './use-search';

export function SearchTabs({ active }: { active: SearchTab }) {
  const [params] = useSearchParams();

  return (
    <nav aria-label="Sonuç türü" className="mt-4">
      <ul className="row-scroll flex gap-1 overflow-x-auto">
        {SEARCH_TABS.map((tab) => {
          const next = new URLSearchParams(params);
          if (tab.param) next.set('tur', tab.param);
          else next.delete('tur');
          const selected = tab.id === active.id;

          return (
            <li key={tab.id}>
              <Link
                to={{ search: next.toString() }}
                replace
                preventScrollReset
                aria-current={selected ? 'page' : undefined}
                className={pillLink(selected)}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
