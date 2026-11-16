import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Error from '@/components/core/error';
import {
  BROWSE_PAGE_SIZE,
  BROWSE_ROUTES,
  browsePageCount,
  browsePageItems,
  browsePath,
  loadBrowseEntries,
  parseBrowsePage,
  type BrowseKind,
} from '@/services/browse/browseIndex';
import { absoluteUrl, PROFILE_ERROR_ROBOTS } from '@/utils/seo';
import s from './BrowseIndexPage.module.scss';

const LABELS: Record<BrowseKind, { plural: string; singular: string; listing: string }> = {
  teams: { plural: 'teams', singular: 'team', listing: 'Teams' },
  members: { plural: 'members', singular: 'member', listing: 'Members' },
  projects: { plural: 'projects', singular: 'project', listing: 'Projects' },
};

type SearchParams = { [key: string]: string | string[] | undefined };

function range(page: number, total: number) {
  return { first: (page - 1) * BROWSE_PAGE_SIZE + 1, last: Math.min(page * BROWSE_PAGE_SIZE, total) };
}

/**
 * Title, description and a self-canonical for one browse page (LAB-3093). A page that is not a whole number, or past
 * the last page, is a 404, decided here: metadata resolves before the page streams, so this is what sets the status.
 */
export async function browseMetadata(kind: BrowseKind, searchParams: SearchParams): Promise<Metadata> {
  const { plural, singular } = LABELS[kind];
  const page = parseBrowsePage(searchParams.page);
  if (page === null) notFound();

  const entries = await loadBrowseEntries(kind);
  if (!entries) {
    return { title: `All ${plural} A–Z | Protocol Labs Directory`, robots: PROFILE_ERROR_ROBOTS };
  }
  if (page > browsePageCount(entries.length)) notFound();

  const { first, last } = range(page, entries.length);
  const url = absoluteUrl(browsePath(kind, page));
  return {
    title: `All ${plural} A–Z${page > 1 ? `, page ${page}` : ''} | Protocol Labs Directory`,
    description: `Every ${singular} in the Protocol Labs network, A to Z: ${first}–${last} of ${entries.length.toLocaleString('en-US')}.`,
    alternates: { canonical: url },
    openGraph: { url },
  };
}

/** One page of the browse index: plain links to profiles, and links to every other page. */
export async function BrowseIndexPage({ kind, searchParams }: { kind: BrowseKind; searchParams: SearchParams }) {
  const { plural, listing } = LABELS[kind];
  const page = parseBrowsePage(searchParams.page);
  if (page === null) notFound();

  const entries = await loadBrowseEntries(kind);
  if (!entries) return <Error />;

  const pages = browsePageCount(entries.length);
  if (page > pages) notFound();

  const { first, last } = range(page, entries.length);
  const route = BROWSE_ROUTES[kind];

  return (
    <div className={s.root}>
      <a className={s.back} href={route}>
        ← {listing}
      </a>
      <h1 className={s.title}>All {plural}, A–Z</h1>
      <p className={s.meta}>
        {entries.length > 0
          ? `${first.toLocaleString('en-US')}–${last.toLocaleString('en-US')} of ${entries.length.toLocaleString('en-US')} ${plural}`
          : `No ${plural} yet`}
        {pages > 1 ? ` · page ${page} of ${pages}` : ''}
      </p>
      {/* Plain anchors, not next/link: 200 links in view would each be prefetched. */}
      <ul className={s.list}>
        {browsePageItems(entries, page).map((entry) => (
          <li key={entry.uid}>
            <a className={s.link} href={`${route}/${entry.uid}`}>
              {entry.name}
            </a>
          </li>
        ))}
      </ul>
      {pages > 1 && <BrowsePager kind={kind} page={page} pages={pages} />}
    </div>
  );
}

function BrowsePager({ kind, page, pages }: { kind: BrowseKind; page: number; pages: number }) {
  return (
    <nav className={s.pager} aria-label="Pages">
      {page > 1 && (
        <a className={s.pagerStep} href={browsePath(kind, page - 1)} rel="prev">
          ← Previous
        </a>
      )}
      <ol className={s.pagerList}>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            {n === page ? (
              <span className={`${s.pagerItem} ${s.pagerCurrent}`} aria-current="page">
                {n}
              </span>
            ) : (
              <a className={s.pagerItem} href={browsePath(kind, n)}>
                {n}
              </a>
            )}
          </li>
        ))}
      </ol>
      {page < pages && (
        <a className={s.pagerStep} href={browsePath(kind, page + 1)} rel="next">
          Next →
        </a>
      )}
    </nav>
  );
}

/**
 * A listing's link to its full A–Z index (LAB-3093): a quiet line under the list, in the server HTML. It must be
 * visible: hidden for LAB-3184, the link left the index unknown to Google.
 */
export function BrowseAllLink({ kind }: { kind: BrowseKind }) {
  return (
    <p className={s.browseAll} data-testid="browse-all-link">
      <a href={browsePath(kind)}>Browse all {LABELS[kind].plural}, A–Z</a>
    </p>
  );
}
