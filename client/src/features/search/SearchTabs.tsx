import { Link, useSearchParams } from 'react-router';
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
                className={`pressable flex h-11 items-center rounded-full px-4 font-medium ${
                  selected ? 'bg-light text-room' : 'text-light-dim hover:text-light'
                }`}
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
