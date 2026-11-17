import { DigestPastIssuesCard, type DigestPastIssuesCardProps } from './DigestPastIssuesCard';
import { DigestTopicsCard, type DigestTopicsCardProps } from './DigestTopicsCard';

import s from './DigestSidebar.module.scss';

/**
 * The page's side cards (LAB-3287, the digest-web prototype's DigestSidebar): Add topics (LAB-3289), then How
 * personalization works, then Past issues (LAB-3294). From 1100px a sticky column on the right (`rail`); under that
 * the same cards follow the end of the issue (`inline`).
 */
export function DigestSidebar({
  variant,
  topics,
  issues,
}: {
  variant: 'rail' | 'inline';
  topics: DigestTopicsCardProps;
  issues: DigestPastIssuesCardProps;
}) {
  return (
    <div className={variant === 'rail' ? s.rail : s.inline}>
      <DigestTopicsCard headingId={`topics-${variant}`} {...topics} />
      <section className={s.card} aria-labelledby={`how-${variant}`}>
        <h2 id={`how-${variant}`} className={s.cardTitle}>
          How personalization works
        </h2>
        <p className={s.cardText}>
          Stories come from your topics first, then the teams you follow, then the network’s top stories.
        </p>
      </section>
      <DigestPastIssuesCard listId={`past-${variant}`} {...issues} />
    </div>
  );
}
