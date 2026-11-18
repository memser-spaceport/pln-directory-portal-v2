'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { Button } from '@/components/common/Button';
import { toast } from '@/components/core/ToastContainer';
import chips from '@/components/page/news-preferences/NewsPreferences.module.scss';
import { useApproveNewsDefaultTags, useAutosaveNewsDefaultTags } from '@/services/team-news/hooks/useNewsDefaultTags';

import { sourceLine, type TagCard } from './newsTagCard.utils';
import s from './NewsTagCard.module.scss';

const NEWS_PREFERENCES_HREF = '/settings/news-preferences?from=feed';
const TITLE_ID = 'news-tag-card-title';
/** How long the card waits after the last chip press before it saves the selection (LAB-3295). */
export const TAG_CARD_AUTOSAVE_MS = 800;

interface NewsTagCardProps {
  memberUid?: string;
  /** Null while there is nothing to ask: no default tags, the member's own tags, or an answered card. */
  card: TagCard | null;
  /** False while a filter or search hides the card. It stays mounted, so the member's chips are kept. */
  visible: boolean;
  className?: string;
}

/**
 * The member's default news tags on Home, to approve or change (LAB-3250). It stands where the "For you" line is
 * until the member answers. "Looks good" approves the tags as shown, "Save topics" saves the chips left on as the
 * member's own, and "See all topics" approves and opens News preferences. A chip press also saves the selection on
 * its own (LAB-3295, LAB-3244 scope 4): after a short wait, and at once when the member leaves Home or the page.
 */
export function NewsTagCard({ memberUid, card, visible, className }: NewsTagCardProps) {
  const { onTeamNewsTagsCardShown } = useTeamNewsAnalytics();
  const shownFor = useRef<string | null>(null);

  useEffect(() => {
    if (!visible || !card || !memberUid || shownFor.current === memberUid) return;
    shownFor.current = memberUid;
    onTeamNewsTagsCardShown({ memberUid, source: card.source, tags: card.tags.map((tag) => tag.slug) });
  }, [visible, card, memberUid, onTeamNewsTagsCardShown]);

  if (!card || !memberUid) return null;
  return <TagCardBody memberUid={memberUid} card={card} visible={visible} className={className} />;
}

function TagCardBody({ memberUid, card, visible, className }: NewsTagCardProps & { memberUid: string; card: TagCard }) {
  const router = useRouter();
  const analytics = useTeamNewsAnalytics();
  const { mutate, isPending } = useApproveNewsDefaultTags(memberUid);
  const { mutate: autosave } = useAutosaveNewsDefaultTags();
  const shown = card.tags.map((tag) => tag.slug);
  const [picked, setPicked] = useState<string[]>(shown);
  const changed = picked.length !== shown.length;
  const event = { memberUid, source: card.source };

  // The selection that waits for its autosave, or null when nothing waits.
  const pending = useRef<string[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True after an autosave went out. A button then sends the chips that are on, not a plain approval.
  const saved = useRef(false);

  const flush = useCallback(
    (keepalive = false) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const selection = pending.current;
      pending.current = null;
      // With every chip off there is nothing to save; the last saved selection stays.
      if (!selection || selection.length === 0) return;
      saved.current = true;
      // Always the chips that are on: an earlier autosave may have saved fewer tags as the member's own.
      autosave(
        { tags: selection, keepalive },
        { onError: () => toast.error('Could not save your topics. Please try again.') },
      );
    },
    [autosave],
  );

  // Save at once when the member leaves Home (unmount) or the page (reload, tab close).
  useEffect(() => {
    const onPageHide = () => flush(true);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      flush(true);
    };
  }, [flush]);

  const toggle = (slug: string) => {
    const on = !picked.includes(slug);
    // Kept in the shown order, so what is saved reads like the card.
    const next = shown.filter((tag) => (tag === slug ? on : picked.includes(tag)));
    setPicked(next);
    analytics.onTeamNewsTagsCardTagToggled({ ...event, tag: slug, on });
    pending.current = next;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), TAG_CARD_AUTOSAVE_MS);
  };

  const cancelAutosave = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
  };

  const answer = () => {
    cancelAutosave();
    if (changed) {
      analytics.onTeamNewsTagsCardSaved({
        ...event,
        tags: picked,
        removedTags: shown.filter((tag) => !picked.includes(tag)),
      });
    } else {
      analytics.onTeamNewsTagsCardApproved({ ...event, tags: shown });
    }
    mutate(changed || saved.current ? picked : undefined, {
      onSuccess: () => toast.success('Topics saved'),
      onError: () => toast.error('Could not save your topics. Please try again.'),
    });
  };

  const seeAll = () => {
    cancelAutosave();
    analytics.onTeamNewsTagsCardSeeAllClicked(event);
    // Opening News preferences counts as answering; the page does not wait for the call.
    mutate(saved.current && picked.length > 0 ? picked : undefined);
    router.push(NEWS_PREFERENCES_HREF);
  };

  return (
    <section className={clsx(s.card, className)} aria-labelledby={TITLE_ID} hidden={!visible}>
      <h3 id={TITLE_ID} className={s.title}>
        We picked these topics for you
      </h3>
      <p className={s.description}>{sourceLine(card.source)}</p>
      <div className={clsx(chips.chips, s.chips)} role="group" aria-label="Your topics">
        {card.tags.map(({ slug }) => {
          const on = picked.includes(slug);
          return (
            <button
              key={slug}
              type="button"
              className={clsx(chips.chip, on && chips.chipOn)}
              aria-pressed={on}
              title={on ? `Remove #${slug}` : `Add #${slug}`}
              onClick={() => toggle(slug)}
            >
              {on ? <CheckIcon /> : <PlusIcon />}#{slug}
            </button>
          );
        })}
      </div>
      <div className={s.actions}>
        <Button
          size="xs"
          className={clsx(s.action, s.glossy)}
          disabled={isPending || picked.length === 0}
          onClick={answer}
        >
          {changed ? 'Save topics' : 'Looks good'}
        </Button>
        <Button size="xs" style="border" variant="neutral" className={s.action} onClick={seeAll}>
          See all topics
        </Button>
      </div>
    </section>
  );
}

// News preferences' chip icons.
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
