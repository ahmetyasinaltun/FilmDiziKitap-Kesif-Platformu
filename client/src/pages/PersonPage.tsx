import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { PosterRow } from '../components/PosterRow';
import { PageError, PortraitSkeleton, PortraitStage } from '../features/people/PortraitStage';
import { usePerson } from '../features/people/use-people';
import { pageTitle } from '../lib/brand';
import { contentPath, type PersonCredit, type PersonDetail } from '../lib/content';
import { formatDate } from '../lib/format';
import { departmentLabel, isMinorCredit, roleLabel } from '../lib/labels';

const KNOWN_FOR_SIZE = 6;
const FILMOGRAPHY_PREVIEW = 25;

function personMeta(person: PersonDetail): string {
  const born = person.birthday
    ? `Doğum: ${formatDate(person.birthday)}${person.placeOfBirth ? `, ${person.placeOfBirth}` : ''}`
    : null;
  const died = person.deathday ? `Ölüm: ${formatDate(person.deathday)}` : null;
  return [departmentLabel(person.department), born, died].filter(Boolean).join(' · ');
}

function CreditList({ credits, className = '' }: { credits: PersonCredit[]; className?: string }) {
  return (
    <ol className={`max-w-3xl divide-y divide-line ${className}`}>
      {credits.map(({ content, roles }) => {
        // "Writer" ve "Screenplay" ikisi de "Senaryo": aynı etiket bir kez yazılır.
        const labels = new Set(roles.map(roleLabel));
        const details = [content.type === 'tv' ? 'Dizi' : null, ...labels]
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
  );
}

function Filmography({ credits }: { credits: PersonCredit[] }) {
  const [showAll, setShowAll] = useState(false);
  if (credits.length === 0) return null;

  // Asıl işler önce; kendisi olarak göründüğü yapımlar ve teşekkürler "Tümünü göster"de, ayrı
  // grupta. Genişletince üstteki satırlar yer değiştirmez, liste yalnız aşağı uzar.
  const main = credits.filter((credit) => !isMinorCredit(credit.roles));
  const minor = credits.filter((credit) => isMinorCredit(credit.roles));
  const preview = (main.length > 0 ? main : minor).slice(0, FILMOGRAPHY_PREVIEW);

  return (
    <section aria-labelledby="filmografi" className="perde-width page-gutter mt-14">
      <h2 id="filmografi" className="font-display text-[1.75rem] leading-tight">
        Filmografi
      </h2>
      {showAll ? (
        <>
          {main.length > 0 && <CreditList credits={main} className="mt-3" />}
          {main.length > 0 && minor.length > 0 && (
            <div className="mt-10">
              <h3 className="font-medium">Diğer görünümler</h3>
              <p className="text-sm text-light-dim">
                Kendisi olarak yer aldığı yapımlar, arşiv görüntüleri ve teşekkürler.
              </p>
            </div>
          )}
          {minor.length > 0 && <CreditList credits={minor} className="mt-3" />}
        </>
      ) : (
        <CreditList credits={preview} className="mt-3" />
      )}
      {credits.length > preview.length && (
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
        source={{
          name: 'TMDB',
          href: `https://www.themoviedb.org/person/${encodeURIComponent(data.id)}`,
        }}
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
