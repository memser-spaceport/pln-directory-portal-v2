'use client';

import clsx from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import np from '@/components/page/news-preferences/NewsPreferences.module.scss';

import { CheckIcon, PlusIcon } from './DigestTopicIcons';

import s from './DigestSidebar.module.scss';

const MAX_ROWS = 3;
/** Up to this many of the reader's own topics show as chips; more show as "N selected" (LAB-3348). */
export const MAX_OWN_CHIPS = 5;

export type DigestTopicsCardProps = {
  followed: string[];
  suggested: string[];
  canSave: boolean;
  /** Signed in: chips toggle. Signed out: a chip press goes to sign-in. Undefined until the auth store hydrates. */
  signedIn: boolean | undefined;
  /** A chip ticked before sign-in, ticked again on return (`?topic=<slug>`). */
  initialPick: string | null;
  onSave: (next: string[]) => Promise<boolean>;
  onOpenAll: () => void;
  onSignIn: (slug: string) => void;
};

type Props = DigestTopicsCardProps & { headingId: string };

/**
 * "Add topics" (LAB-3289, the digest-web prototype's TopicsCard). LAB-3348: "Your topics" first, the reader's own
 * topics as ticked chips (up to MAX_OWN_CHIPS, else "N selected"), so the card never looks empty to a reader who has
 * topics; then "Suggested topics", the topics they don't follow yet in the page's weight order, as many as fill three
 * rows. Save topics appears once a chip differs from what's saved; a failed save keeps the picks.
 */
export function DigestTopicsCard({
  headingId,
  followed,
  suggested,
  canSave,
  signedIn,
  initialPick,
  onSave,
  onOpenAll,
  onSignIn,
}: Props) {
  // Overrides on top of what's saved, so a save that lands (the cache moves) needs no reset.
  const [draft, setDraft] = useState<Record<string, boolean>>(() => (initialPick ? { [initialPick]: true } : {}));
  const [saving, setSaving] = useState(false);
  const saved = new Set(followed);
  const ticked = (slug: string) => draft[slug] ?? saved.has(slug);
  const changed = Object.entries(draft).some(([slug, on]) => on !== saved.has(slug));
  const chipsRef = useRef<HTMLDivElement>(null);
  // Signed out the page knows no topics of the reader's, so only the suggestions show. A suggestion saved during the
  // visit stays where it was, ticked, so "Your topics" leaves out what the suggestions already show.
  const mine = signedIn ? followed : [];
  const own = mine.filter((slug) => !suggested.includes(slug));

  // Three rows of chips, whatever the card's width: hide the chips that wrap past row three (hidden, not just
  // clipped, so keyboard focus never lands on one you can't see). CSS clamps the same height before this runs.
  useLayoutEffect(() => {
    const row = chipsRef.current;
    if (!row) return;
    const clamp = () => {
      const chips = [...row.children] as HTMLElement[];
      chips.forEach((chip) => (chip.hidden = false));
      const tops: number[] = [];
      for (const chip of chips) {
        if (!tops.includes(chip.offsetTop)) tops.push(chip.offsetTop);
        chip.hidden = tops.indexOf(chip.offsetTop) >= MAX_ROWS;
      }
    };
    clamp();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(clamp);
    observer?.observe(row);
    return () => observer?.disconnect();
  }, [suggested]);

  const press = (slug: string) => {
    if (signedIn === undefined) return;
    if (!signedIn) return onSignIn(slug);
    setDraft((prev) => ({ ...prev, [slug]: !ticked(slug) }));
  };

  const chipButton = (slug: string) => {
    const on = ticked(slug);
    return (
      <button
        key={slug}
        type="button"
        className={clsx(np.chip, on && np.chipOn)}
        aria-pressed={on}
        title={on ? `Remove #${slug}` : `Add #${slug}`}
        onClick={() => press(slug)}
      >
        {on ? <CheckIcon /> : <PlusIcon />}#{slug}
      </button>
    );
  };

  const save = async () => {
    const next = [
      ...followed.filter((slug) => draft[slug] !== false),
      ...Object.keys(draft).filter((slug) => draft[slug] && !saved.has(slug)),
    ];
    setSaving(true);
    const ok = await onSave(next);
    setSaving(false);
    if (ok) setDraft({});
  };

  return (
    <section className={s.card} aria-labelledby={headingId}>
      <h2 id={headingId} className={s.cardTitle}>
        Add topics
      </h2>
      <p className={s.cardText}>Tick a topic to get stories about it in your digest.</p>
      {(mine.length > MAX_OWN_CHIPS || own.length > 0) && (
        <>
          <h3 id={`${headingId}-own`} className={s.cardLabel}>
            Your topics
          </h3>
          {mine.length > MAX_OWN_CHIPS ? (
            <p className={s.cardText}>{mine.length} selected</p>
          ) : (
            <div className={clsx(np.chips, s.chips)} role="group" aria-labelledby={`${headingId}-own`}>
              {own.map((slug) => chipButton(slug))}
            </div>
          )}
        </>
      )}
      {suggested.length > 0 && (
        <>
          <h3 id={`${headingId}-suggested`} className={s.cardLabel}>
            Suggested topics
          </h3>
          <div
            ref={chipsRef}
            className={clsx(np.chips, s.chips)}
            role="group"
            aria-labelledby={`${headingId}-suggested`}
          >
            {/* Fixed order: a chip never moves when it's ticked or unticked (News preferences' rule). */}
            {suggested.map((slug) => chipButton(slug))}
          </div>
        </>
      )}
      <div className={s.actions}>
        {changed && signedIn && (
          <Button size="xs" className={s.glossy} disabled={!canSave || saving} onClick={save}>
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
