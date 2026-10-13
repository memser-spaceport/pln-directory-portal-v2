'use client';

import clsx from 'clsx';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
// The team page's own tag row (Tag + tooltip), so a Focus cell draws a team's
// industry tags exactly as its profile does.
import { TagsList } from '@/components/common/profile/TagsList';

import type { AnswerBlock, ComparisonBlock, ComparisonCell, DirectoryHit } from './mocks';
import { IntroPathsRows } from './IntroPathsRows';
import s from './AnswerBlocks.module.scss';

/* The same "no picture yet" marks `DirectoryResultsCards` uses. */
const FALLBACK_LOGO: Record<Exclude<DirectoryHit['type'], 'member'>, string> = {
  team: '/icons/team-default-profile.svg',
  project: '/icons/project-default.svg',
  event: '/icons/irl-event-default-logo.svg',
};

const pictureOf = (hit: DirectoryHit) =>
  hit.avatar ?? (hit.type === 'member' ? getDefaultAvatar(hit.name) : FALLBACK_LOGO[hit.type]);

/**
 * Rich answer blocks — the parts of an answer that are a *shape* rather than
 * prose. Drawn after the prose has streamed, before the directory cards.
 *
 * Two kinds. `intros` — a founder's way to the investors an answer named — is
 * its own file (`IntroPathsRows`). The other is a comparison table: one column per entity compared,
 * one row per fact. Perplexity and Gemini both answer "compare X and Y" with
 * a table, and theirs hold text; ours holds the directory — a Focus cell is
 * the team's tag row, a People cell is member rows that open the profile —
 * because the backend knows what each retrieved object is.
 *
 * Chrome is the design system's `Table` (pl-design-system/components/Table:
 * 12px/500 tertiary header on the soft surface, 8/16 header padding, 16px
 * cell padding, hairline row rules), transcribed with the token+fallback
 * pairs this app needs, in the answer card's own 8px-radius hairline box. Two
 * deviations, on purpose: cells align top, because a comparison row holds
 * multi-line facts read across, and rows have no hover — nothing in a row is
 * pressed as a row.
 */
export function AnswerBlocks({ blocks }: { blocks: AnswerBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'comparison':
            return <ComparisonTable key={i} block={block} />;
          case 'intros':
            return <IntroPathsRows key={i} block={block} />;
          default:
            return null;
        }
      })}
    </>
  );
}

function ComparisonTable({ block }: { block: ComparisonBlock }) {
  const label = `Comparison of ${block.columns.map((c) => c.name).join(' and ')}`;
  return (
    <div className={s.tableWrap} role="region" aria-label={label}>
      <table className={s.table}>
        <thead>
          <tr>
            {/* The corner over the row labels stays empty: the labels name themselves. */}
            <th scope="col" className={clsx(s.th, s.corner)} aria-label="Fact" />
            {block.columns.map((col) => (
              <th key={col.source} scope="col" className={s.th}>
                <a className={s.colHead} href={col.source}>
                  <img
                    className={clsx(s.picture, s.pictureLg, col.type !== 'member' && s.logo)}
                    src={pictureOf(col)}
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className={s.colName}>{col.name}</span>
                </a>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className={clsx(s.th, s.rowHead)}>
                {row.label}
              </th>
              {row.cells.map((cell, i) => (
                <td key={i} className={s.td}>
                  <Cell cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ cell }: { cell: ComparisonCell }) {
  switch (cell.kind) {
    case 'text':
      return <span className={clsx(cell.muted && s.muted)}>{cell.value}</span>;
    case 'tags':
      return <TagsList tags={cell.values.map((title) => ({ title }))} tagsToShow={3} />;
    case 'entities':
      return (
        <ul className={s.entities}>
          {cell.hits.map((hit) => {
            const external = /^https?:/i.test(hit.source);
            return (
              <li key={hit.source}>
                <a
                  className={s.entity}
                  href={hit.source}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer' : undefined}
                >
                  <img
                    className={clsx(s.picture, hit.type !== 'member' && s.logo)}
                    src={pictureOf(hit)}
                    alt=""
                    width={20}
                    height={20}
                  />
                  <span className={s.entityName}>{hit.name}</span>
                </a>
              </li>
            );
          })}
        </ul>
      );
  }
}
