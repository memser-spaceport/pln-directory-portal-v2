'use client';

/**
 * Events every hop on a path attended — a shared event is a property of the
 * *edge* between two hops, not of either person, so `MasterProfile.events`
 * (listed per person elsewhere) gets its overlap computed here instead of asking
 * the reader to open both profiles and compare by eye.
 *
 * Copy rule: **"Both attended", never "met at"**. Two people at a conference with
 * a few thousand attendees did not necessarily meet, and a UI that says they did
 * is asserting something the data can't support.
 */

import { useMemo, useState } from 'react';
import { CalendarBlankIcon } from '@/components/icons';
import { eventsFromProfile } from './masterProfileDisplay.util';
import { useMasterProfiles } from '@/services/investors/hooks/useMasterProfiles';
import type { WarmPathV2HopNode } from './parseWarmPathHopChain';
// The drawer's own count chip, reused so one number means one thing in this panel.
import d from './WarmIntrosV2InvestorDrawer.module.scss';
import s from './SharedEventsNote.module.scss';

/** Past this many events the list collapses behind a `+N` tile. */
const EVENTS_SHOWN = 3;

/** "A & B both attended" / "A, B & C all attended". Neither says they met. */
function attendedBy(people: string[]): string {
  const verb = people.length > 2 ? 'all attended' : 'both attended';
  const names =
    people.length > 2 ? `${people.slice(0, -1).join(', ')} & ${people[people.length - 1]}` : people.join(' & ');
  return `${names} ${verb}`;
}

interface Props {
  hops: WarmPathV2HopNode[];
  /**
   * Only fetch hop profiles once the drawer/section is actually visible — this
   * is a per-hop batched fetch (see useMasterProfiles), not free.
   */
  enabled?: boolean;
}

/**
 * Shared events, grouped by the pair (or wider set) that attended rather than
 * repeated per event. The pair states itself once as a caption, and the events
 * list beneath it — the pair is the constant, the events are what vary.
 */
export function SharedEventsNote({ hops, enabled = true }: Props) {
  const [expanded, setExpanded] = useState(false);

  const uids = useMemo(() => [...new Set(hops.map((h) => h.profileUid).filter(Boolean))], [hops]);
  const profilesByUid = useMasterProfiles(uids, { enabled });

  const eventsByUid = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const uid of uids) {
      const profile = profilesByUid.get(uid);
      map.set(uid, new Set(profile ? eventsFromProfile(profile) : []));
    }
    return map;
  }, [uids, profilesByUid]);

  // Who shares each event, accumulated across every adjacent pair. Keyed by event
  // rather than by pair, because an event can span more than two hops — if all
  // three attended, that's one event with three people, not the same event twice.
  const peopleByEvent = useMemo(() => {
    const map = new Map<string, string[]>();
    for (let i = 0; i < hops.length - 1; i += 1) {
      const from = hops[i];
      const to = hops[i + 1];
      if (!from?.profileUid || !to?.profileUid) continue;
      const fromEvents = eventsByUid.get(from.profileUid);
      const toEvents = eventsByUid.get(to.profileUid);
      if (!fromEvents || !toEvents) continue;
      for (const event of fromEvents) {
        if (!toEvents.has(event)) continue;
        const people = map.get(event) ?? [];
        for (const nm of [from.name, to.name]) {
          if (nm && !people.includes(nm)) people.push(nm);
        }
        map.set(event, people);
      }
    }
    return map;
  }, [hops, eventsByUid]);

  const groups = useMemo(() => {
    const out: Array<{ key: string; people: string[]; events: string[] }> = [];
    for (const [event, people] of peopleByEvent) {
      const key = people.join('|');
      const existing = out.find((g) => g.key === key);
      if (existing) existing.events.push(event);
      else out.push({ key, people, events: [event] });
    }
    return out;
  }, [peopleByEvent]);

  if (groups.length === 0) return null;

  const total = peopleByEvent.size;
  // Org stubs (e.g. "Protocol Labs") have no profileUid and never take part in a
  // pair, so they must not be counted as part of the chain.
  const chainPeople = hops.filter((hop) => hop.profileUid).length;
  const overflow = total - EVENTS_SHOWN;

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
        {total > 1 ? <span className={d.count}>{total}</span> : null}
      </div>

      {visible.map((group, groupIndex) => (
        <div key={group.key} className={s.eventGroup}>
          {/* The caption exists to say *which* of the chain shared this event, so
              it only appears when that's a subset of the chain — naming everyone
              on the path just retypes the chain rendered directly above. */}
          {group.people.length < chainPeople ? <div className={s.eventPair}>{attendedBy(group.people)}</div> : null}
          <div className={s.eventChips}>
            {group.events.map((event) => (
              <span key={event} className={s.eventRow}>
                <span className={s.eventIcon} aria-hidden>
                  <CalendarBlankIcon />
                </span>
                <span className={s.eventName}>{event}</span>
              </span>
            ))}
            {overflow > 0 && groupIndex === visible.length - 1 ? (
              <button type="button" className={s.eventsMore} onClick={() => setExpanded((v) => !v)}>
                {expanded ? 'Show fewer' : `+${overflow}`}
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
