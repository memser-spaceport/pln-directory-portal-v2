'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { ChevronDownIcon } from '@/components/icons';

import dt from '../digest-topics/DigestTopicsPrototype.module.scss';
import fb from '../follow-shared/FollowButton.module.scss';

import { DIGEST_SUGGESTED_TOPICS } from './mocks';

import s from './DigestSidebar.module.scss';

export interface PastIssue {
  id: string;
  /** The issue's top story. */
  lead: string;
}

/**
 * The web page's side column, modelled on Perplexity Discover's right rail (Mobbin): small
 * white cards, each with one job.
 *
 * 1. How personalization works: Perplexity's "How Discover works". One card, title plus the
 *    pick order (Vova's backend order). First, so the explanation comes before the ask, and it's
 *    the page's only explanation: the web intro line was dropped (manager, 2026-11-20).
 * 2. Suggested topics (was "Add topics", renamed 2026-11-20): topics the reader doesn't follow
 *    yet, as News preferences' own control chips (digest-topics `.chip`/`.chipOn`, the same ones
 *    the For You starter card uses). Followed topics aren't shown (Polina, 2026-11-17). Save
 *    topics appears once a chip changes; See all topics opens the All topics modal
 *    (`AllTopicsModal`), where unfollowing happens too.
 * 3. Past issues: collapsed by default, so the cards above stay in view.
 *
 * From 1100px it's a sticky column on the right; under that the same cards follow the end of
 * the issue (`variant="inline"`).
 */
export function DigestSidebar({
  variant,
  currentIssue,
  latestIssue,
  pastIssues,
  formatDate,
  subscribed,
  onSaveTopics,
  onOpenAllTopics,
}: {
  variant: 'rail' | 'inline';
  currentIssue: string;
  latestIssue: string;
  pastIssues: PastIssue[];
  formatDate: (id: string) => string;
  /** The reader's topics, held by the page so the card and the All topics modal agree. */
  subscribed: string[];
  onSaveTopics: (topics: string[]) => void;
  onOpenAllTopics: () => void;
}) {
  return (
    <div className={variant === 'rail' ? s.rail : s.inline}>
      <section className={s.card} aria-labelledby={`how-${variant}`}>
        <h2 id={`how-${variant}`} className={s.cardTitle}>
          How personalization works
        </h2>
        <p className={s.cardText}>
          Stories come from your topics first, then the teams you follow, then the network’s top stories.
        </p>
      </section>
      <TopicsCard
        key={subscribed.join()}
        subscribed={subscribed}
        onSave={onSaveTopics}
        onOpenAll={onOpenAllTopics}
      />
      <PastIssuesCard
        id={`past-${variant}`}
        current={currentIssue}
        latest={latestIssue}
        issues={pastIssues}
        formatDate={formatDate}
      />
    </div>
  );
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function TopicsCard({
  subscribed,
  onSave,
  onOpenAll,
}: {
  subscribed: string[];
  onSave: (topics: string[]) => void;
  onOpenAll: () => void;
}) {
  // Only topics the reader doesn't follow yet (Polina, 2026-11-17): the card adds topics;
  // unfollowing is in the All topics modal. `saved` is which suggestions are subscribed now
  // (the page remounts this card when the subscribed set changes, so the two agree).
  const saved = DIGEST_SUGGESTED_TOPICS.filter((t) => subscribed.includes(t));
  const [picked, setPicked] = useState<string[]>(saved);
  const changed = picked.length !== saved.length || picked.some((t) => !saved.includes(t));
  const toggle = (t: string) => setPicked((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <section className={s.card} aria-labelledby="digest-topics-title">
      <h2 id="digest-topics-title" className={s.cardTitle}>
        Suggested topics
      </h2>
      <p className={s.cardText}>Tick a topic to get stories about it in your digest.</p>
      <div className={clsx(dt.chips, s.chips)} role="group" aria-label="Topics to add">
        {/* Fixed order: a chip never moves when it's ticked or unticked (News preferences' rule). */}
        {DIGEST_SUGGESTED_TOPICS.map((t) => {
          const on = picked.includes(t);
          return (
            <button
              key={t}
              type="button"
              className={clsx(dt.chip, on && dt.chipOn)}
              aria-pressed={on}
              title={on ? `Remove #${t}` : `Add #${t}`}
              onClick={() => toggle(t)}
            >
              {on ? <CheckIcon /> : <PlusIcon />}#{t}
            </button>
          );
        })}
      </div>
      <div className={s.actions}>
        {changed && (
          <Button
            size="xs"
            className={fb.glossy}
            onClick={() =>
              onSave([...subscribed.filter((t) => !DIGEST_SUGGESTED_TOPICS.includes(t)), ...picked])
            }
          >
            Save topics
          </Button>
        )}
        <button type="button" className={s.link} onClick={onOpenAll}>
          See all topics
        </button>
      </div>
    </section>
  );
}

function PastIssuesCard({
  id,
  current,
  latest,
  issues,
  formatDate,
}: {
  id: string;
  current: string;
  latest: string;
  issues: PastIssue[];
  formatDate: (id: string) => string;
}) {
  // Collapsed by default, but open when the reader is already on an older issue.
  const [open, setOpen] = useState(current !== latest);

  return (
    <section className={s.card}>
      <h2 className={s.cardTitle}>
        <button
          type="button"
          className={s.disclosure}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          Past issues
          <ChevronDownIcon className={clsx(s.chevron, open && s.chevronOpen)} aria-hidden />
        </button>
      </h2>
      {open && (
        <ol id={id} className={s.issues}>
          {issues.map((issue) => {
            const active = issue.id === current;
            return (
              <li key={issue.id}>
                <a
                  href={issue.id === latest ? '?' : `?issue=${issue.id}`}
                  className={clsx(s.issue, active && s.issueActive)}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={s.issueDate}>
                    {formatDate(issue.id)}
                    {issue.id === latest && <span className={s.issueLatest}> · Latest</span>}
                  </span>
                  <span className={s.issueLead}>{issue.lead}</span>
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
