'use client';

import clsx from 'clsx';

import { Badge, type BadgeProps } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { CheckIcon } from '@/components/icons/CheckIcon';
// The person chip is Warm Intros v2's own — the founder sees the connector
// drawn the way PL's workspace draws them. Rendered static: there is no
// MasterProfile for a founder to open.
import chip from '@/components/page/investors/WarmIntrosV2Workspace/PathProfileChip.module.scss';

import {
  ASK_STATUS_LABEL,
  CONNECTOR_KIND_LABEL,
  connectorKindOf,
  connectorOf,
  sectorLabels,
  type AskStatus,
  type FounderInvestorRow,
  type IntroAsk,
} from './mocks';
import s from './WarmIntrosFounders.module.scss';
import door from './IntroDoors.module.scss';

// Waiting is brand (something is in motion), both outcomes the connector or
// founder confirmed are success, and a decline is neutral — it is one person's
// "not this time" with a next action beside it, not an error.
const ASK_STATUS_BADGE: Record<AskStatus, BadgeProps['variant']> = {
  requested: 'brand',
  made: 'success',
  met: 'success',
  declined: 'default',
};

/**
 * Column labels, on the row's own grid so they cannot drift from the cells.
 * Hidden below tablet-landscape, where a row is a stack and has no columns.
 */
export function InvestorTableHead() {
  return (
    <div className={s.tableHead}>
      <span className={s.thInvestor}>Investor</span>
      <span>Intro via</span>
      <span className={s.thStatus}>Status</span>
    </div>
  );
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * The connector as running text — bold brand blue, no pill or avatar. AI Search
 * uses it (via `plain` on the rows) where the intro is a line of a sentence:
 * "Intro via **Mara Velasquez**".
 */
export function ConnectorName({ name }: { name: string }) {
  return <span className={door.connectorName}>{name}</span>;
}

export function ConnectorChip({ name }: { name: string }) {
  return (
    <span className={clsx(chip.chip, chip.chipStatic)}>
      <span className={chip.avatarWrap}>
        <span className={chip.avatar} aria-hidden>
          {initialsOf(name) || '?'}
        </span>
      </span>
      <span className={chip.label}>{name}</span>
    </span>
  );
}

interface Props {
  row: FounderInvestorRow;
  ask?: IntroAsk;
  onAsk: () => void;
  /** After a decline: ask the row's alternate connector. */
  onAskAlternate?: () => void;
  /** The founder's own tick, offered once the connector has made the intro. */
  onMarkMet?: () => void;
  /** The investor's profile, when the host has one to open. */
  href?: string;
  /** AI Search: the connector is bold blue text, not a chip. */
  plain?: boolean;
}

/**
 * One investor, from the founder's seat: who they are, what ties them to PL in
 * plain words, the ONE person who can make the intro, and the press.
 *
 * No score, no caliber, no proximity code — those rank paths for an analyst;
 * a founder needs "who do I ask", and the list order already carries the rank.
 */
export function InvestorPathRow({ row, ask, onAsk, onAskAlternate, onMarkMet, href, plain }: Props) {
  const facts = row.evidence.length ? row.evidence.join(' · ') : `Invests in ${sectorLabels(row)}`;
  const connector = connectorOf(row, ask);

  return (
    <div className={s.row}>
      <span className={s.avatar} aria-hidden>
        {initialsOf(row.name)}
      </span>

      <div className={s.who}>
        <p className={s.name}>
          {href ? (
            <a className={door.nameLink} href={href}>
              {row.name}
            </a>
          ) : (
            row.name
          )}
        </p>
        <p className={s.meta}>{[row.firm, row.title].filter(Boolean).join(' · ')}</p>
        <p className={s.facts}>{facts}</p>
      </div>

      {/* From tablet-landscape the column header says "Intro via", so the row's
          own label is kept for screen readers only; on a phone there is no
          header row and it reads "Intro via [chip] PL team" in one line. */}
      <div className={s.via}>
        <span className={s.viaLabel}>Intro via</span>
        {plain ? <ConnectorName name={connector.name} /> : <ConnectorChip name={connector.name} />}
        <span className={s.viaKind}>{CONNECTOR_KIND_LABEL[connectorKindOf(row, ask)]}</span>
      </div>

      <AskAction row={row} ask={ask} onAsk={onAsk} onAskAlternate={onAskAlternate} onMarkMet={onMarkMet} />
    </div>
  );
}

/**
 * The row's last cell — the press, or what became of it — on its own so the
 * investor profile's intro block offers the identical cluster (one ask, one set
 * of states, wherever the founder meets the investor).
 */
export function AskAction({ row, ask, onAsk, onAskAlternate, onMarkMet }: Omit<Props, 'href'>) {
  // A decline is one person's "not this time", not the end of the path: when
  // the graph knows someone else, the declined row's action is that person.
  // Offered once — an ask that already went through the alternate has no third.
  const alternate = ask?.status === 'declined' && !ask.via ? row.alternate : null;

  return (
    <div className={s.action}>
      {!ask && (
        <Button style="border" variant="primary" size="xs" onClick={onAsk}>
          Ask for intro
        </Button>
      )}
      {ask && (
        <div className={s.status}>
          {/* Production's Badge, borderless, with a soft fill from this
              stylesheet (its own fills are 2%). Confirmed outcomes carry a
              check, so the state isn't told by ink alone. */}
          <Badge
            variant={ASK_STATUS_BADGE[ask.status]}
            noBorder
            className={clsx(s.pill, s[`pill_${ASK_STATUS_BADGE[ask.status]}`])}
          >
            {(ask.status === 'made' || ask.status === 'met') && <CheckIcon aria-hidden />}
            {ASK_STATUS_LABEL[ask.status]}
          </Badge>
          <span className={s.statusClock}>{ask.daysAgo === 0 ? 'Today' : `${ask.daysAgo}d ago`}</span>
          {ask.status === 'made' && onMarkMet && (
            <Button style="link" variant="primary" size="xs" onClick={onMarkMet}>
              Mark as met
            </Button>
          )}
          {alternate && onAskAlternate && (
            <Button style="link" variant="primary" size="xs" onClick={onAskAlternate}>
              Ask {alternate.connector.name.split(' ')[0]} instead
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
