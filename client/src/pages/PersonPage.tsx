import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { PosterRow } from '../components/PosterRow';
import { PageError, PortraitSkeleton, PortraitStage } from '../features/people/PortraitStage';
import { usePerson } from '../features/people/use-people';
import { pageTitle } from '../lib/brand';
import { contentPath, type PersonCredit, type PersonDetail } from '../lib/content';
import { formatDate } from '../lib/format';
import { departmentLabel, roleLabel } from '../lib/labels';

const KNOWN_FOR_SIZE = 6;
const FILMOGRAPHY_PREVIEW = 25;

function personMeta(person: PersonDetail): string {
  const born = person.birthday
    ? `Doğum: ${formatDate(person.birthday)}${person.placeOfBirth ? `, ${person.placeOfBirth}` : ''}`
    : null;
  const died = person.deathday ? `Ölüm: ${formatDate(person.deathday)}` : null;
  return [departmentLabel(person.department), born, died].filter(Boolean).join(' · ');
}

function Filmography({ credits }: { credits: PersonCredit[] }) {
  const [showAll, setShowAll] = useState(false);
  if (credits.length === 0) return null;
  const shown = showAll ? credits : credits.slice(0, FILMOGRAPHY_PREVIEW);

  return (
    <section aria-labelledby="filmografi" className="perde-width page-gutter mt-14">
      <h2 id="filmografi" className="font-display text-[1.75rem] leading-tight">
        Filmografi
      </h2>
      <ol className="mt-3 max-w-3xl divide-y divide-line">
        {shown.map(({ content, roles }) => {
          const details = [content.type === 'tv' ? 'Dizi' : null, ...roles.map(roleLabel)]
            .filter(Boolean)
            .join(' · ');
          return (
            <li key={`${content.type}-${content.id}`} className="flex gap-4 py-2.5">
              <span className="w-12 shrink-0 tabular-nums text-light-dim">
                {content.year ?? <span aria-label="Yılı belli değil">–</span>}
              </span>
              <div className="min-w-0">
                <Link
                  to={contentPath(content.type, content.id)}
                  className="font-medium hover:underline hover:underline-offset-4"
                >
                  {content.title}
                </Link>
                {details && <p className="text-sm text-light-dim">{details}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {credits.length > FILMOGRAPHY_PREVIEW && (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex h-11 cursor-pointer items-center underline underline-offset-4 hover:no-underline"
        >
          {showAll ? 'Daha az göster' : `Tümünü göster (${credits.length})`}
        </button>
      )}
    </section>
  );
}

function PersonContent({ id }: { id: string }) {
  const person = usePerson(id);

  if (person.isPending) return <PortraitSkeleton />;
  if (person.isError) {
    return (
      <PageError
        error={person.error}
        notFoundTitle="Bu kişi bulunamadı"
        onRetry={() => void person.refetch()}
      />
    );
  }

  const data = person.data;
  return (
    <>
      <title>{pageTitle(data.name)}</title>
      <PortraitStage
        name={data.name}
        image={data.profile}
        meta={personMeta(data)}
        text={data.biography}
        emptyText="Bu kişi için biyografi bulunamadı."
        source="Kaynak: TMDB"
      />
      <div className="perde-width page-gutter mt-14">
        <PosterRow title="Bilinen işleri" items={data.knownFor.slice(0, KNOWN_FOR_SIZE)} />
      </div>
      <Filmography credits={data.credits} />
    </>
  );
}

export function PersonPage() {
  const { id = '' } = useParams();
  return <PersonContent key={id} id={id} />;
}
