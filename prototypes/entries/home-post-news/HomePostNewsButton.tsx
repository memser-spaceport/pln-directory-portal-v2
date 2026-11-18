'use client';

import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { PlusIcon } from '@/components/icons';

// Production PostNewsButton's own classes (inline-flex, 4px gap, no wrap).
import prod from '@/components/page/team-details/TeamNews/PostNewsModal/PostNewsModal.module.scss';
import local from './HomePostNews.module.scss';

/**
 * The Home's "Post news": a copy of the team page's `PostNewsButton`
 * (components/page/team-details/TeamNews/PostNewsModal/PostNewsButton.tsx).
 *
 * Same object as the team page: DS `fill` `primary`, the 16px `PlusIcon`, the
 * label "Post news". Two deltas, both marked for the build:
 * 1. No one-time "New" callout on Home (Polina, PR #3613).
 * 2. Height. It takes the box of the 30px search button beside it on desktop
 *    (lesson 27), and 32px on phones (Polina, PR #3613). The type stays at
 *    the DS `xxs` scale on desktop.
 */
export function HomePostNewsButton({ onPost, forceHover = false }: { onPost: () => void; forceHover?: boolean }) {
  return (
    <Button
      size="xxs"
      style="fill"
      variant="primary"
      className={clsx(prod.postAction, local.homePostAction, forceHover && local.forceHover)}
      onClick={onPost}
    >
      <PlusIcon width={16} height={16} aria-hidden="true" />
      Post news
    </Button>
  );
}
