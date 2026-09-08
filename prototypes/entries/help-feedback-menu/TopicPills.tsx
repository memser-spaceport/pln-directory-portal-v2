'use client';

import clsx from 'clsx';

import { CONTACT_SUPPORT_TOPICS } from '@/components/ContactSupport/constants';
// Production's single-select pill row — the category chips over search results
// (Top / Members / Teams …): bordered neutral at rest, brand-filled when
// chosen, brand border on hover. Its stylesheet is imported so the row tracks
// production; the local class only lets it wrap, because this row sits in a
// 440px form rather than a scrolling strip.
import sc from '@/components/core/application-search/components/SearchCategories/SearchCategories.module.scss';

import local from './SupportModal.module.scss';

interface Props {
  value: string;
  onChange: (topic: string) => void;
}

/**
 * The five topics as pills, replacing the "Please choose topic below" dropdown
 * in the Contact Support modal.
 *
 * Same five values, same order, same component the form already had — only
 * the *visibility* changes. A dropdown makes four of the five topics cost a
 * press to even see, and PostHog says that press is never spent (12 non-default
 * topics in 605 opens over 90 days). Pills put the whole offer on screen at
 * rest, so someone who arrived through the menu sees their choice confirmed and
 * someone who arrived through another door (an auth error, the forum's
 * signed-out view, a `?dialog=` link) sees what else they could be sending.
 */
export function TopicPills({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Topic" className={clsx(sc.root, local.pillRow)}>
      {CONTACT_SUPPORT_TOPICS.map((topic) => {
        const active = topic.value === value;
        return (
          <button
            key={topic.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={clsx(sc.categoryBadge, local.pill, active && sc.active)}
            onClick={() => onChange(topic.value)}
          >
            {topic.label}
          </button>
        );
      })}
    </div>
  );
}
