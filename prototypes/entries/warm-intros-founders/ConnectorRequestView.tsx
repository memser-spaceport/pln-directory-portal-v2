'use client';

/**
 * The connector's half of the consent step — what Mara (or a fellow founder)
 * sees when a founder asks them for an intro. In production this is most
 * likely an email + a notification that lands here; the prototype shows the
 * landing screen only.
 *
 * One request at a time, two presses. It is Warm Intros v2's `canRefer`
 * yes / no, moved from a question PL asks in the abstract ("can you refer?")
 * to one a real founder is asking right now. "No" asks no follow-up — same
 * rule as v2's strip: the verdict is the signal, and a required reason is
 * how a decline turns into an ignored request.
 */

import { Button } from '@/components/common/Button';

import { ConnectorChip } from './InvestorPathRow';
import { FOUNDER, FOUNDER_TEAM, connectorOf, type FounderInvestorRow, type IntroAsk } from './mocks';
import s from './WarmIntrosFounders.module.scss';

interface Props {
  /** Open requests, oldest first. */
  requests: Array<{ ask: IntroAsk; row: FounderInvestorRow }>;
  onDecide: (investorUid: string, verdict: 'made' | 'declined') => void;
}

export function ConnectorRequestView({ requests, onDecide }: Props) {
  const current = requests[0];

  if (!current) {
    return (
      <div className={s.connectorWrap}>
        <div className={s.connectorCard}>
          <p className={s.empty}>No intro requests waiting.</p>
        </div>
      </div>
    );
  }

  const { ask, row } = current;
  const investorFirst = row.name.split(' ')[0];
  // The demo walks every open request in turn, so the seat changes with the
  // request — the count must be this connector's own, not the founder's total.
  const me = connectorOf(row, ask);
  const waiting = requests.filter((r) => connectorOf(r.row, r.ask).profileUid === me.profileUid).length;
  // The full v2 reason is this person's own relationship, so they may read it —
  // but only on the path it was written for, not when they are the alternate.
  const reason = ask.via ? null : row.connectorReason;

  return (
    <div className={s.connectorWrap}>
      <div className={s.connectorNav}>
        <span>Viewing as {me.name}</span>
        <span>
          {waiting} {waiting === 1 ? 'request' : 'requests'} waiting
        </span>
      </div>

      <div className={s.connectorCard}>
        <div>
          <h1 className={s.connectorTitle}>
            {FOUNDER.name} asks for an intro to {row.name}
          </h1>
          <p className={s.connectorSub}>
            {FOUNDER.title}, {FOUNDER_TEAM.name} · {ask.daysAgo === 0 ? 'today' : `${ask.daysAgo}d ago`}
          </p>
        </div>

        <div className={s.path}>
          <ConnectorChip name={FOUNDER.name} />
          <span className={s.pathArrow} aria-hidden>
            →
          </span>
          <ConnectorChip name="You" />
          <span className={s.pathArrow} aria-hidden>
            →
          </span>
          <ConnectorChip name={row.name} />
          {reason && <p className={s.pathReason}>{reason}</p>}
        </div>

        <p className={s.blurb}>{ask.blurb}</p>

        <div className={s.connectorActions}>
          <Button style="fill" variant="primary" size="s" onClick={() => onDecide(row.uid, 'made')}>
            I&apos;ll make the intro
          </Button>
          <Button style="border" variant="neutral" size="s" onClick={() => onDecide(row.uid, 'declined')}>
            Not this time
          </Button>
        </div>

        <p className={s.privacy}>
          You send the intro yourself, from your own email — {investorFirst}&apos;s details are never shared with{' '}
          {FOUNDER.name.split(' ')[0]}.
        </p>
      </div>
    </div>
  );
}
