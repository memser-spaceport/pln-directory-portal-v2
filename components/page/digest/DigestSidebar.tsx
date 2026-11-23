import { DigestPastIssuesCard, type DigestPastIssuesCardProps } from './DigestPastIssuesCard';
import { DigestTopicsSection, type DigestPersonalizeProps } from './DigestTopicsSection';
import type { DigestTopicsCardProps } from './DigestTopicsCard';

import s from './DigestSidebar.module.scss';

/**
 * The page's side cards (LAB-3287, the digest-web prototype's DigestSidebar). From 1100px a sticky column on the
 * right (`rail`): the topics section (How personalization works, then Suggested topics; LAB-3348), then Past issues
 * (LAB-3294). Under 1100px the topics section sits after the header (`DigestTopicsSection` `top`), so the cards
 * after the end of the issue (`inline`) are Past issues only, and nothing when there is no Past issues card.
 */
export function DigestSidebar({
  variant,
  topics,
  personalize,
  issues,
}: {
  variant: 'rail' | 'inline';
  topics: DigestTopicsCardProps;
  personalize: DigestPersonalizeProps;
  issues: DigestPastIssuesCardProps;
}) {
  if (variant === 'inline') {
    if (issues.issues.length < 2) return null;
    return (
      <div className={s.inline}>
        <DigestPastIssuesCard listId="past-inline" {...issues} />
      </div>
    );
  }
  return (
    <div className={s.rail}>
      <DigestTopicsSection variant="rail" topics={topics} personalize={personalize} />
      <DigestPastIssuesCard listId="past-rail" {...issues} />
    </div>
  );
}
