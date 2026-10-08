'use client';

import clsx from 'clsx';

// The team page's own tag row (Tag + tooltip), as the current table uses.
import { TagsList } from '@/components/common/profile/TagsList';

import type { AnswerBlock, ComparisonBlock, ComparisonCell } from '../../ai-search/mocks';
import { IntroPathsRows } from '../../ai-search/IntroPathsRows';
import { pictureOf } from './entities';
import s from './AnswerShapes.module.scss';

/**
 * Rich answer blocks, proposed drawing. Maps to the ai-search entry's
 * `AnswerBlocks` (CannedAnswer.blocks); production has no structured blocks
 * yet — its `Markdown` draws a markdown table with #ddd borders and a #f5f5f5
 * head, which is the "before" an engineer will actually meet.
 *
 * The comparison table keeps the design system's `Table` anatomy (12px/500
 * header on the soft surface, hairline rules) and changes three things:
 *
 * - **Entities lead.** A column head is the record — 24px picture and the
 *   name at 14/600 — so the table reads "Lumen Storage vs Saturn Grid" before
 *   it reads any fact. The empty corner cell above the row labels goes white.
 * - **Row labels are legible.** 12px/500 *secondary* instead of tertiary
 *   (tertiary 12px fails 4.5:1 on white), and "None listed" becomes a dash
 *   in tertiary with the words kept for screen readers.
 * - **Phones get a different shape, not a scroller.** Below 640px the table
 *   becomes fact blocks: the label on its own line, the two values side by
 *   side under the two column heads. The current table holds a 560px min-width
 *   and scrolls sideways inside a 358px column, so half of every comparison is
 *   off screen.
 *
 * `intros` blocks (founder seat only) are the warm-intros rows, unchanged.
 */
export function AnswerShapes({ blocks }: { blocks: AnswerBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.kind === 'comparison') return <Comparison key={i} block={block} />;
        if (block.kind === 'intros') return <IntroPathsRows key={i} block={block} />;
        return null;
      })}
    </>
  );
}

function ColumnHead({ col }: { col: ComparisonBlock['columns'][number] }) {
  return (
    <a className={s.colHead} href={col.source}>
      <img
        className={clsx(s.pic, s.picLg, col.type !== 'member' && s.logo)}
        src={pictureOf(col.type, col.name, col.avatar)}
        alt=""
        width={24}
        height={24}
      />
      <span className={s.colName}>{col.name}</span>
    </a>
  );
}

function Comparison({ block }: { block: ComparisonBlock }) {
  const label = `Comparison of ${block.columns.map((c) => c.name).join(' and ')}`;
  return (
    <div className={s.wrap} role="region" aria-label={label}>
      {/* ≥640: the table. */}
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col" className={clsx(s.th, s.corner)}>
              <span className={s.srOnly}>Fact</span>
            </th>
            {block.columns.map((col) => (
              <th key={col.source} scope="col" className={clsx(s.th, s.colTh)}>
                <ColumnHead col={col} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className={s.rowHead}>
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

      {/* <640: fact blocks. Same content, read top to bottom. Whichever shape
          is `display: none` at this width is out of the accessibility tree too. */}
      <div className={s.stack}>
        <div className={s.stackHead} style={{ gridTemplateColumns: `repeat(${block.columns.length}, minmax(0, 1fr))` }}>
          {block.columns.map((col) => (
            <ColumnHead key={col.source} col={col} />
          ))}
        </div>
        {block.rows.map((row) => (
          <div key={row.label} className={s.fact}>
            <div className={s.factLabel}>{row.label}</div>
            <div className={s.factCells} style={{ gridTemplateColumns: `repeat(${row.cells.length}, minmax(0, 1fr))` }}>
              {row.cells.map((cell, i) => (
                <div key={i} className={s.factCell}>
                  <Cell cell={cell} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ cell }: { cell: ComparisonCell }) {
  switch (cell.kind) {
    case 'text':
      return cell.muted ? (
        <span className={s.none}>
          <span aria-hidden="true">—</span>
          <span className={s.srOnly}>{cell.value}</span>
        </span>
      ) : (
        <span>{cell.value}</span>
      );
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
                    className={clsx(s.pic, hit.type !== 'member' && s.logo)}
                    src={pictureOf(hit.type, hit.name, hit.avatar)}
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
