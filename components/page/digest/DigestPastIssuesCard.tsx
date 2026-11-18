'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { ChevronDownIcon } from '@/components/icons';
import type { DigestIssue } from '@/services/digest/digest.types';

import { formatDigestDate } from './DigestHeader';

import s from './DigestSidebar.module.scss';

export type DigestPastIssuesCardProps = {
  /** Newest first, as the page read sends them. */
  issues: DigestIssue[];
  /** The send time of the issue on show. */
  current: string;
  hrefFor: (issue: DigestIssue) => string;
};

type Props = DigestPastIssuesCardProps & { listId: string };

const sameInstant = (a: string, b: string) => Date.parse(a) === Date.parse(b);

/**
 * Past issues (LAB-3294, the digest-web prototype's PastIssuesCard): the member's latest issues, each with its date
 * and top story, the one on show marked. Collapsed on the latest issue, open on an older one. Hidden until there is
 * more than one issue to list.
 */
export function DigestPastIssuesCard({ listId, issues, current, hrefFor }: Props) {
  const latest = issues[0];
  const [open, setOpen] = useState(() => Boolean(latest) && !sameInstant(latest.sentAt, current));
  if (issues.length < 2) return null;

  return (
    <section className={s.card}>
      <h2 className={s.cardTitle}>
        <button
          type="button"
          className={s.disclosure}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
        >
          Past issues
          <ChevronDownIcon className={clsx(s.chevron, open && s.chevronOpen)} aria-hidden />
        </button>
      </h2>
      {open && (
        <ol id={listId} className={s.issues}>
          {issues.map((issue) => {
            const active = sameInstant(issue.sentAt, current);
            return (
              <li key={issue.sentAt}>
                <a
                  href={hrefFor(issue)}
                  className={clsx(s.issue, active && s.issueActive)}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={s.issueDate}>
                    {formatDigestDate(issue.sentAt, 'date')}
                    {issue === latest && <span className={s.issueLatest}> · Latest</span>}
                  </span>
                  {issue.title && <span className={s.issueLead}>{issue.title}</span>}
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
