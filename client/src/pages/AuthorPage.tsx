import { useParams } from 'react-router';
import { posterGrid } from '../components/button-styles';
import { PosterCard } from '../components/PosterRow';
import { PageError, PortraitSkeleton, PortraitStage } from '../features/people/PortraitStage';
import { useAuthor } from '../features/people/use-people';
import { pageTitle } from '../lib/brand';
import type { AuthorDetail } from '../lib/content';
import { yearIn } from '../lib/format';

/** Open Library tarihleri İngilizce serbest metin ("30 July 1818"); sadece yıllar gösterilir. */
function lifeYears(author: AuthorDetail): string {
  const born = yearIn(author.birthDate);
  const died = yearIn(author.deathDate);
  if (born && died) return `${born} – ${died}`;
  if (born) return `${born} doğumlu`;
  return died ? `Ölüm: ${died}` : '';
}

function AuthorContent({ id }: { id: string }) {
  const author = useAuthor(id);

  if (author.isPending) return <PortraitSkeleton />;
  if (author.isError) {
    return (
      <PageError
        error={author.error}
        notFoundTitle="Bu yazar bulunamadı"
        onRetry={() => void author.refetch()}
      />
    );
  }

  const data = author.data;
  const source = (
    <>
      Kaynak:{' '}
      <a
        href={`https://openlibrary.org/authors/${encodeURIComponent(data.id)}`}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-4 hover:text-light"
      >
        Open Library
      </a>
    </>
  );

  return (
    <>
      <title>{pageTitle(data.name)}</title>
      <PortraitStage
        name={data.name}
        image={data.photo}
        meta={lifeYears(data)}
        text={data.bio}
        emptyText="Bu yazar için biyografi bulunamadı."
        source={source}
      />
      {data.works.length > 0 && (
        <section aria-labelledby="eserleri" className="perde-width page-gutter mt-14">
          <h2 id="eserleri" className="mb-4 font-display text-[1.75rem] leading-tight">
            Eserleri
          </h2>
          <ul className={posterGrid}>
            {data.works.map((work) => (
              <li key={work.id}>
                <PosterCard item={work} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export function AuthorPage() {
  const { id = '' } = useParams();
  return <AuthorContent key={id} id={id} />;
}
