'use client';

import { AskAction, ConnectorChip } from './InvestorPathRow';
import {
  CONNECTOR_KIND_LABEL,
  connectorKindOf,
  connectorOf,
  tieLine,
  type FounderInvestorRow,
  type IntroAsk,
} from './mocks';
import door from './IntroDoors.module.scss';

interface Props {
  row: FounderInvestorRow;
  ask?: IntroAsk;
  onAsk: () => void;
  onAskAlternate?: () => void;
  onMarkMet?: () => void;
  /** No "Intro via" label (AI Search): the connector is just the blue chip. */
  bare?: boolean;
}

/**
 * The intro offer for ONE investor whose identity is already on screen — their
 * own profile, or an answer that is about them. Who makes the intro, how they
 * know the investor, and the Fundraising row's own action cluster.
 *
 * The table row (`InvestorPathRow`) is for a list, where each row has to say
 * who the investor is. Here that would repeat the page, so this is the row
 * minus its first two cells.
 */
export function IntroViaLine({ row, ask, onAsk, onAskAlternate, onMarkMet, bare }: Props) {
  const connector = connectorOf(row, ask);
  const tie = tieLine(row, connector);

  return (
    <div className={door.introBody}>
      <div className={door.introPath}>
        {!bare && <span className={door.introKind}>Intro via</span>}
        <ConnectorChip name={connector.name} brand={bare} />
        <span className={door.introKind}>{CONNECTOR_KIND_LABEL[connectorKindOf(row, ask)]}</span>
        {tie && <p className={door.introTie}>{tie}</p>}
      </div>
      <AskAction row={row} ask={ask} onAsk={onAsk} onAskAlternate={onAskAlternate} onMarkMet={onMarkMet} />
    </div>
  );
}
