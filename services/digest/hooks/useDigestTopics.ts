import { useCallback, useMemo } from 'react';

import { useDigestAnalytics } from '@/analytics/digest.analytics';
import { toast } from '@/components/core/ToastContainer';
import { useCurrentUserStore } from '@/services/auth/store';
import type { DigestTopics } from '@/services/digest/digest.types';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';
import { useSetNewsTags } from '@/services/members/hooks/useSetNewsTags';

export type DigestTopicsState = {
  /** Slugs followed now: the signed-in member's saved tags once loaded; before that, or signed out, the link's. */
  followed: string[];
  /** The page's suggestions, in weight order. Fixed for the visit: a chip never moves or disappears. */
  suggested: string[];
  /** Signed in and their own tags have loaded, so a save starts from the right list. */
  canSave: boolean;
  /** Saves the full list as the signed-in member's news tags. Resolves true when saved. */
  save: (next: string[], surface: 'card' | 'modal') => Promise<boolean>;
};

/**
 * The digest page's topics (LAB-3289): the member's News preferences tags. Saved only through the signed-in member's
 * own preferences save (`useSetNewsTags`), never through the link; a failed save puts the cached tags back and says
 * so, and the caller keeps what the reader picked.
 */
export function useDigestTopics(topics: DigestTopics): DigestTopicsState {
  const { currentUser } = useCurrentUserStore();
  const { data: preferences } = useGetMemberPreferences(currentUser?.uid);
  const setNewsTags = useSetNewsTags(currentUser?.uid);
  const analytics = useDigestAnalytics();

  const linkFollowed = useMemo(() => topics.followed.map((t) => t.slug), [topics.followed]);
  const suggested = useMemo(() => topics.suggested.map((t) => t.slug), [topics.suggested]);
  const followed = (currentUser && preferences?.newsTags) || linkFollowed;
  const canSave = Boolean(currentUser && preferences);

  const save = useCallback(
    (next: string[], surface: 'card' | 'modal') =>
      new Promise<boolean>((resolve) => {
        if (!canSave) return resolve(false);
        const before = new Set(followed);
        const after = new Set(next);
        setNewsTags([...after], {
          onSuccess: () => {
            analytics.onTopicsSaved({
              surface,
              added: [...after].filter((t) => !before.has(t)).length,
              removed: [...before].filter((t) => !after.has(t)).length,
              total: after.size,
            });
            toast.success('Topics saved. Your next digest uses them.');
            resolve(true);
          },
          onError: () => resolve(false),
        });
      }),
    [canSave, followed, setNewsTags, analytics],
  );

  return { followed, suggested, canSave, save };
}
