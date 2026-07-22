'use client';

import clsx from 'clsx';

import { ActionCard } from '@/components/page/home/QuickActions/components/ActionCard/ActionCard';

// Reuse the production Quick Actions styling 1:1.
import s from '@/components/page/home/QuickActions/QuickActions.module.scss';
import local from './NewsfeedV0.module.scss';

import { QUICK_ACTIONS } from './quickActions';

/**
 * Copy of the production `QuickActions`. The real component resolves the card
 * set from the auth store + RBAC / office-hours access hooks; here the richest
 * variant (the 'pl-infra' group) is rendered statically from the shared
 * QUICK_ACTIONS list. `ActionCard` and the section SCSS are the production ones.
 */
export function QuickActionsMock() {
  return (
    <section className={s.section}>
      {/* Demoted to a quiet secondary label — Quick Actions is a utility strip
          above the feed hero, not a peer headline. Subtitle dropped as filler. */}
      <h2 className={clsx(s.title, local.qaTitleDemoted)}>Quick Actions</h2>
      <div className={clsx(s.grid, local.qaGrid4)}>
        {QUICK_ACTIONS.map((action) => (
          <ActionCard
            key={action.href}
            icon={action.icon}
            title={action.title}
            description={action.description}
            href={action.href}
          />
        ))}
      </div>
    </section>
  );
}
