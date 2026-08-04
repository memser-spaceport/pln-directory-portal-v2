'use client';

/**
 * Why a path is claimed to exist — the two halves of it.
 *
 * **Provenance.** The payload puts a `sourceType` on every reason and
 * `parseWarmPathHopChain` reads it (`pickPrimaryReasonDescription` even prefers
 * `webVerify`), but nothing has ever rendered it: the drawer flattens reasons to
 * strings via `allReasonDescriptions`, so a web-verified fact and a model's guess
 * arrive on screen looking identical. That's the difference between an intro
 * request that lands and one that embarrasses someone, so it gets shown.
 *
 * **Shared events.** `MasterProfile.events` exists per person and the modal lists
 * it, but nothing computes the *overlap* — today you'd open both profiles and
 * compare by eye. The intersection is the interesting part, so it's derived here.
 *
 * Deliberate copy choice: **"Both attended", never "met at"**. Two people at a
 * conference with a few thousand attendees did not necessarily meet, and a UI
 * that says they did is asserting something the data can't support.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { CalendarBlankIcon } from '@/components/icons';
// The drawer's count chip, reused so one number means one thing in this panel.
import d from '@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2InvestorDrawer.module.scss';
import type { WarmPathV2HopNode } from '@/components/page/investors/WarmIntrosV2Workspace/parseWarmPathHopChain';
import { reasonDescription } from '@/components/page/investors/WarmIntrosV2Workspace/parseWarmPathHopChain';
import { sharedEventsBetween } from './mocks';
import s from './PathEvidence.module.scss';

/** `reasonSourceType` is module-private in production, so it is re-derived here. */
function sourceTypeOf(reason: unknown): string | null {
  if (!reason || typeof reason !== 'object' || Array.isArray(reason)) return null;
  const value = (reason as Record<string, unknown>).sourceType;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const SOURCE_LABEL: Record<string, string> = {
  webVerify: 'Web-verified',
  sharedEvent: 'Shared event',
  affinity: 'Affinity',
  directory: 'Directory',
  llmPairing: 'Model-inferred',
};

/** Only this one is a guess; everything else is an observation of some record. */
const WEAK_SOURCES = new Set(['llmPairing']);

function sourceLabel(sourceType: string | null): string | null {
  if (!sourceType) return null;
  return SOURCE_LABEL[sourceType] ?? sourceType.replace(/([a-z])([A-Z])/g, '$1 $2');
}

/**
 * Reason bullets that keep their provenance. Takes production's `.reasonList`
 * class so the list itself is styled exactly as the drawer already styles it.
 */
export function ReasonList({ reasons, listClassName }: { reasons: unknown[]; listClassName?: string }) {
  const seen = new Set<string>();
  const items: Array<{ text: string; sourceType: string | null }> = [];

  for (const raw of reasons) {
    const text = reasonDescription(raw);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ text, sourceType: sourceTypeOf(raw) });
  }

  if (items.length === 0) return null;

  return (
    <ul className={listClassName}>
      {items.map((item) => {
        const label = sourceLabel(item.sourceType);
        return (
          <li key={item.text}>
            {item.text}
            {label ? (
              <span className={clsx(s.source, item.sourceType && WEAK_SOURCES.has(item.sourceType) && s.sourceWeak)}>
                · {label}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Events both ends of an edge attended, computed per adjacent pair — a shared
 * event is a property of the *edge*, not of either person, so it is reported
 * against the pair rather than hung off one chip.
 */
/** Past this many events the list collapses behind a toggle. */
const EVENTS_SHOWN = 3;

/**
 * "A & B both attended" / "A, B & C all attended".
 *
 * `both` only works for two, and swapping to `all` past that is the difference
 * between a claim that parses and one that quietly doesn't. Neither says they met.
 */
function attendedBy(people: string[]): string {
  const verb = people.length > 2 ? 'all attended' : 'both attended';
  const names =
    people.length > 2 ? `${people.slice(0, -1).join(', ')} & ${people[people.length - 1]}` : people.join(' & ');
  return `${names} ${verb}`;
}

/**
 * Shared events, grouped by the pair rather than repeated per event.
 *
 * Two rewrites got us here. The first led with the names — but those names are the
 * two chips directly above this block, so the line opened on what you already knew
 * and put the new fact last. The second put the event first but restated
 * "X & Y both attended" under *every* event, which is the same sentence copied
 * down the block: the pair is the constant, the events are what vary.
 *
 * So the pair states itself once, as a caption, and the events list beneath it.
 * The shape is Confluence's "Worked on" — glyph, bold subject, grouped under a
 * heading — with Discord's count-first framing on the header.
 *
 * **The caption only appears when who is ambiguous.** On a two-hop chain there is
 * exactly one possible pair — the chain sitting right above — so there is no
 * caption at all: "Both attended" under a heading that already says "Shared
 * events" is one idea wearing two labels. Three hops or more can pair up more than
 * one way, and can put three people at a single event, so there the caption says
 * who.
 *
 * The copy constraint stands: **never "met at"**. Two people at a conference did
 * not necessarily meet. "Shared events" carries that on its own — it states
 * co-attendance and claims nothing further — and where the caption does appear it
 * says "both/all attended" for the same reason.
 */
export function SharedEventsNote({ hops }: { hops: WarmPathV2HopNode[] }) {
  const [expanded, setExpanded] = useState(false);

  // Who shares each event, accumulated across every adjacent pair. Keyed by event
  // rather than by pair because an event can span three hops — if all three
  // attended, that is one event with three people, not the same event twice.
  const peopleByEvent = new Map<string, string[]>();
  for (let i = 0; i < hops.length - 1; i += 1) {
    const from = hops[i];
    const to = hops[i + 1];
    if (!from?.profileUid || !to?.profileUid) continue;
    for (const event of sharedEventsBetween(from.profileUid, to.profileUid)) {
      const people = peopleByEvent.get(event) ?? [];
      for (const name of [from.name, to.name]) {
        if (name && !people.includes(name)) people.push(name);
      }
      peopleByEvent.set(event, people);
    }
  }

  // Events that involve the same people collapse under one caption, so the names
  // are stated once however many events they share.
  const groups: Array<{ key: string; people: string[]; events: string[] }> = [];
  for (const [event, people] of peopleByEvent) {
    const key = people.join('|');
    const existing = groups.find((g) => g.key === key);
    if (existing) existing.events.push(event);
    else groups.push({ key, people, events: [event] });
  }

  if (groups.length === 0) return null;

  const total = peopleByEvent.size;
  // More than two hops means more than one way to pair them up, so the caption has
  // to say who. At exactly two, the pair is the chain above.
  const namePairs = hops.length > 2;
  const overflow = total - EVENTS_SHOWN;

  /**
   * The visible slice of each group, worked out before rendering rather than
   * during it. The cap is across the whole block, so when it runs out mid-way a
   * later group can end up with nothing to show — and the `+N` chip has to hang
   * off the last group that actually renders, not the last group that exists.
   */
  let budget = expanded ? Infinity : EVENTS_SHOWN;
  const visible = groups
    .map((group) => {
      const events = group.events.slice(0, Math.max(0, budget));
      budget -= events.length;
      return { ...group, events };
    })
    .filter((group) => group.events.length > 0);

  return (
    <div className={s.eventsBlock}>
      <div className={s.eventsHeader}>
        <span className={s.eventsLabel}>Shared events</span>
        {/* The drawer's own count chip, the same one the co-investments block
            uses — one number treatment across the panel. Only past one, since
            "(1)" next to a single visible row is noise. */}
        {total > 1 ? <span className={d.count}>{total}</span> : null}
      </div>

      {visible.map((group, groupIndex) => {
        const events = group.events;

        return (
          <div key={group.key} className={s.eventGroup}>
            {/* No caption on a two-hop chain: "Both attended" under a heading that
                already reads "Shared events" is the same statement twice, and the
                pair it refers to is the chain sitting directly above. The caption
                exists to say *who*, so it appears only when who is ambiguous. */}
            {namePairs ? <div className={s.eventPair}>{attendedBy(group.people)}</div> : null}
            <div className={s.eventChips}>
              {events.map((event) => (
                <span key={event} className={s.eventRow}>
                  <span className={s.eventIcon} aria-hidden>
                    <CalendarBlankIcon />
                  </span>
                  <span className={s.eventName}>{event}</span>
                </span>
              ))}
              {/* The `+N` rides in the chip row, as it does on the team page —
                  last in line rather than a link underneath, so the overflow reads
                  as more of the same thing. Only on the final group, since the cap
                  is across the block rather than per group. */}
              {overflow > 0 && groupIndex === visible.length - 1 ? (
                <button type="button" className={s.eventsMore} onClick={() => setExpanded((v) => !v)}>
                  {expanded ? 'Show fewer' : `+${overflow}`}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
