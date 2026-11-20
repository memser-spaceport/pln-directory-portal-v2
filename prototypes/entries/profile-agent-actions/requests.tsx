'use client';

/**
 * What the agent does with the profile's requests. Scripted (no model), as every agent entry is: the menu
 * sends one of the request lines below, and `profileRequestReply` answers it before the agent's own script.
 *
 *   Book office hours with <member>   → open slots on their booking link + a note → Book (or their page)
 *   Book office hours with someone at <team> → who on the team has office hours, then the same card
 *   Request an intro to <team>        → a drafted request to the PL team → Send (intro-shared's store)
 *
 * Nothing is booked or sent until the member presses. Cards reuse the agent's card chrome (AgentV0).
 */

import clsx from 'clsx';
import { useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';

import type { AgentBlock, AgentBlockContext, AgentReply } from '../home-v2-b/agentScript';
import agentCss from '../home-v2-b/AgentPanel.module.scss';
import v0 from '../home-v2-agent-dock/AgentV0.module.scss';
import { useIntroRequests } from '../intro-shared/introRequests';
import type { Viewer } from '../agent/script';

import { MEMBER, TEAM, TEAM_OFFICE_HOURS, nextSlots } from './mocks';
import s from './ProfileAgentActions.module.scss';

/* The menu's lines. One place, so the menu and the replies can't drift. */
export const bookLine = (name: string) => `Book office hours with ${name}`;
export const BOOK_TEAM_LINE = `Book office hours with someone at ${TEAM.name}`;
export const INTRO_LINE = `Request an intro to ${TEAM.name}`;

const custom = (render: (ctx: AgentBlockContext) => React.ReactNode): AgentBlock => ({ kind: 'custom', render });

export function profileRequestReply(text: string, viewer: Viewer): AgentReply | null {
  const t = text.trim();

  if (t === BOOK_TEAM_LINE)
    return {
      steps: [`Read ${TEAM.name}’s members`, 'Found 2 with office hours'],
      blocks: [
        { kind: 'text', text: `Two people at ${TEAM.name} take office hours. Who would you like to meet?` },
        custom((ctx) => <PeopleOptions ctx={ctx} />),
      ],
    };

  const bookWith = /^book office hours with (.+)$/i.exec(t)?.[1];
  if (bookWith) {
    const teamPerson = TEAM_OFFICE_HOURS.find((p) => p.name === bookWith);
    const person = teamPerson
      ? { name: teamPerson.name, helpWith: teamPerson.helpWith }
      : {
          name: MEMBER.name,
          helpWith: MEMBER.helpWith
            .map((h) => h.toLowerCase())
            .join(', ')
            .replace(/, ([^,]*)$/, ' and $1'),
        };
    const first = person.name.split(' ')[0];
    return {
      steps: [`Read ${person.name}’s office hours`, `Checked open ${MEMBER.sessionLength} slots this week`],
      blocks: [
        {
          kind: 'text',
          text: `${first} takes ${MEMBER.sessionLength} calls on ${person.helpWith}. These slots are open. Pick one and I’ll book it with a note.`,
        },
        custom(() => <BookingCard viewer={viewer} person={person.name} />),
      ],
    };
  }

  if (t === INTRO_LINE)
    return {
      steps: [
        `Read ${TEAM.name}’s profile`,
        `Read your profile and ${viewer.team}’s`,
        'Found who makes these intros: the PL team',
      ],
      blocks: [
        {
          kind: 'text',
          text: `The PL team makes intros to ${TEAM.name} and picks the right person there. Here’s a request from what’s on both profiles. Edit it before you send.`,
        },
        custom(() => <IntroCard viewer={viewer} />),
      ],
    };

  return null;
}

/* ---------- Cards ---------- */

function Check() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={agentCss.stepCheck}>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The agent's numbered options (script.tsx AskOptions), one per person with office hours. */
function PeopleOptions({ ctx }: { ctx: AgentBlockContext }) {
  const [answered, setAnswered] = useState(false);
  if (answered) return null;
  return (
    <ol className={v0.options}>
      {TEAM_OFFICE_HOURS.map((p, i) => (
        <li key={p.name}>
          <button
            type="button"
            className={clsx(agentCss.followUp, v0.option)}
            disabled={ctx.busy}
            onClick={() => {
              setAnswered(true);
              ctx.send(bookLine(p.name));
            }}
          >
            <span className={v0.optionNum}>{i + 1}</span>
            {p.name} · {p.role}
          </button>
        </li>
      ))}
    </ol>
  );
}

function BookingCard({ viewer, person }: { viewer: Viewer; person: string }) {
  const slots = useMemo(() => nextSlots(new Date()), []);
  const first = person.split(' ')[0];
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState(
    `Hi ${first}, I’m ${viewer.firstName}, ${viewer.role} at ${viewer.team}. I’d like to hear how you think about ${viewer.team === 'Lattice Compute' ? 'pricing GPU time for verifiable compute' : 'what we’re building'}.`,
  );
  const [state, setState] = useState<'draft' | 'booked'>('draft');

  if (state === 'booked')
    return (
      <div className={v0.card}>
        <p className={v0.receiptTitle}>
          <Check />
          Booked with {person} · {slot}
        </p>
        {note.trim() && <blockquote className={v0.quote}>{note}</blockquote>}
        <p className={v0.note}>The invite is on its way to {viewer.email}, with your note.</p>
      </div>
    );

  return (
    <div className={v0.card}>
      <div className={v0.cardHead}>
        <span className={v0.label}>With</span>
        <span className={v0.recipient}>{person}</span>
        <span className={v0.label}>· {MEMBER.sessionLength} · video call</span>
      </div>
      <div className={s.slots} role="radiogroup" aria-label="Open slots">
        {slots.map((sl) => (
          <button
            key={sl}
            type="button"
            role="radio"
            aria-checked={slot === sl}
            className={clsx(s.slot, slot === sl && s.slotActive)}
            onClick={() => setSlot(sl)}
          >
            {sl}
          </button>
        ))}
      </div>
      <label className={s.fieldLabel}>
        <span className={v0.label}>Note for {first} (optional)</span>
        <textarea className={v0.field} value={note} rows={3} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className={agentCss.actions}>
        <Button size="xs" style="fill" variant="primary" disabled={!slot} onClick={() => setState('booked')}>
          {slot ? `Book ${slot}` : 'Pick a slot to book'}
        </Button>
        <Button
          size="xs"
          style="border"
          variant="neutral"
          onClick={() => window.open(MEMBER.bookingUrl, '_blank', 'noopener')}
        >
          Other times
        </Button>
      </div>
    </div>
  );
}

function IntroCard({ viewer }: { viewer: Viewer }) {
  const intros = useIntroRequests();
  const [why, setWhy] = useState(
    `${viewer.team} is building verifiable compute markets for AI training. We’d like to talk to someone at ${TEAM.name} working on Filecoin storage for training data: we’re choosing where checkpoints and datasets live, and want to hear what teams in the network already run on it.`,
  );
  const [state, setState] = useState<'draft' | 'sent' | 'dismissed'>(intros.requested(TEAM.uid) ? 'sent' : 'draft');

  if (state === 'dismissed') return <p className={v0.muted}>Not sent.</p>;
  if (state === 'sent')
    return (
      <div className={v0.card}>
        <p className={v0.receiptTitle}>
          <Check />
          Sent to the PL team
        </p>
        <blockquote className={v0.quote}>{why}</blockquote>
        <p className={v0.note}>
          They’ll pick the right person at {TEAM.name} and reply to {viewer.email}.
        </p>
      </div>
    );

  return (
    <div className={v0.card}>
      <div className={v0.cardHead}>
        <span className={v0.label}>To</span>
        <span className={v0.recipient}>PL team</span>
        <span className={v0.label}>· intro to {TEAM.name}</span>
      </div>
      <label className={s.fieldLabel}>
        <span className={v0.label}>Why would you like an intro?</span>
        <textarea className={v0.field} value={why} rows={5} onChange={(e) => setWhy(e.target.value)} />
      </label>
      <p className={v0.note}>Sent with your profile and {viewer.team}’s.</p>
      <div className={agentCss.actions}>
        <Button
          size="xs"
          style="fill"
          variant="primary"
          disabled={!why.trim()}
          onClick={() => {
            intros.send({ uid: TEAM.uid, name: TEAM.name, kind: 'team' }, why, '');
            setState('sent');
          }}
        >
          Send to the PL team
        </Button>
        <Button size="xs" style="border" variant="neutral" onClick={() => setState('dismissed')}>
          Not now
        </Button>
      </div>
    </div>
  );
}
