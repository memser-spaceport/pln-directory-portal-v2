'use client';

/**
 * First visit to For You (Anuj, 2026-11-13): the head of the For You stream shows
 * the topics we picked for the member by default, with two answers: approve them
 * (Looks good), untick any in place (Save topics), or see the full list in News
 * preferences.
 *
 * Reuses the signed-in Homepage entry whole (HomeV2Prototype) — the card goes in
 * WeekFeed's `forYouIntro` slot, where the For You caption normally sits, so the
 * page carries one personalization message at a time. Once answered, the caption
 * comes back.
 *
 * Topics are digest-topics' "Team member" persona, so the set on this card is the
 * set News preferences opens with (backend: the "starter tags" in Vova's pick
 * order, member-picked tags → starter tags → followed teams → admin top stories).
 *
 * Shown until answered, not once per visit: someone who scrolls past it hasn't
 * approved anything. Choose my own topics leaves for News preferences (?from=feed),
 * and arriving there counts as answering. Mocked: answered is held per page load,
 * and the review band's "For You" switch resets it.
 */

import clsx from 'clsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/common/Button';
import { toast } from '@/components/core/ToastContainer';

import HomeV2Prototype from '../home-v2/HomeV2Prototype';
import home from '../home-v2/HomeV2Prototype.module.scss';
import { PERSONAS } from '../digest-topics/mocks';
import dt from '../digest-topics/DigestTopicsPrototype.module.scss';
import fb from '../follow-shared/FollowButton.module.scss';
import feed from '../newsfeed/Newsfeed.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';

import s from './ForYouStarterTopics.module.scss';

const PERSONA = PERSONAS.complete;
const PREFERENCES_HREF = '/prototypes/digest-topics?from=feed';

type Visit = 'first' | 'answered';
const VISIT_OPTIONS: { value: Visit; label: string; note: string }[] = [
  { value: 'first', label: 'First visit', note: 'Default. The starter topics card leads the For You stream.' },
  { value: 'answered', label: 'Answered', note: 'After Looks good: the usual For You caption.' },
];

/** The review switch, as HomeV2Prototype and event-drawer-redesign draw theirs. */
function Switch({ value, onChange }: { value: Visit; onChange: (v: Visit) => void }) {
  return (
    <div className={v0.switchBar}>
      <span className={v0.switchLabel}>For You</span>
      <div className={clsx(v0.switch, home.reviewSwitch)} role="tablist" aria-label="For You">
        {VISIT_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={value === o.value}
            className={clsx(v0.switchBtn, value === o.value && v0.switchBtnActive)}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <span className={clsx(v0.switchNote, feed.reviewNote)}>{VISIT_OPTIONS.find((o) => o.value === value)!.note}</span>
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

/**
 * Perplexity's "Make it yours" card (Mobbin): the picks are ticked chips you can
 * untick in place, and one press saves what's ticked. The chips are News
 * preferences' own (digest-topics `.chip` / `.chipOn`, same icons), so a topic
 * looks and behaves the same on both pages. Untouched, the press approves the
 * picks ("Looks good"); once a chip changes it saves the edit ("Save topics").
 * The full list stays in News preferences, so the second button names it.
 */
function StarterTopicsCard({ onSave }: { onSave: (changed: boolean) => void }) {
  const [picked, setPicked] = useState<string[]>(PERSONA.topics);
  const changed = picked.length !== PERSONA.topics.length;
  const toggle = (t: string) => setPicked((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <section className={s.card} aria-labelledby="for-you-starter-title">
      <h3 id="for-you-starter-title" className={s.title}>
        We picked these topics for you
      </h3>
      <p className={s.description}>Picked from {PERSONA.prefilledFrom}.</p>
      <div className={clsx(dt.chips, s.chips)} role="group" aria-label="Your topics">
        {/* Fixed order: a chip never moves when it's unticked (News preferences' rule). */}
        {PERSONA.topics.map((t) => {
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
        {/* The product's glossy primary (follow-shared `.glossy`, production's three-shadow highlight). */}
        <Button size="xs" className={clsx(s.action, fb.glossy)} onClick={() => onSave(changed)}>
          {changed ? 'Save topics' : 'Looks good'}
        </Button>
        <Button
          size="xs"
          style="border"
          variant="neutral"
          className={s.action}
          onClick={() => window.location.assign(PREFERENCES_HREF)}
        >
          See all topics
        </Button>
      </div>
    </section>
  );
}

export default function ForYouStarterTopicsPrototype() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const visit: Visit = searchParams.get('foryou') === 'answered' ? 'answered' : 'first';
  const setVisit = (v: Visit) => {
    const next = new URLSearchParams(searchParams.toString());
    if (v === 'first') next.delete('foryou');
    else next.set('foryou', v);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  if (!mounted) return <div className={home.mountShell} />;

  return (
    <HomeV2Prototype
      initialState="signed-in"
      initialFeedCat="forYou"
      forYouIntro={
        visit === 'first' ? (
          <StarterTopicsCard
            onSave={() => {
              setVisit('answered');
              toast.success('Topics saved');
            }}
          />
        ) : undefined
      }
      reviewExtra={<Switch value={visit} onChange={setVisit} />}
    />
  );
}
