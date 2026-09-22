'use client';

import { useCallback, useState } from 'react';
import type { WarmIntrosV2ConnectorSummary } from '@/services/investors/warm-intros-v2.types';

import { AskIntroModal, type AskTarget } from './AskIntroModal';
import { useIntroAsks } from './introAsks';
import type { FounderInvestorRow } from './mocks';

/**
 * Everything a surface needs to offer "Ask for intro": the shared asks, a way
 * to open the ask form on a row, and the form itself to mount once.
 *
 * One hook so the three doors (Fundraising section, investor profile, AI Search
 * answer) cannot drift on what sending means — same modal, same record, same
 * one-ask-per-investor replace.
 */
export function useAskIntro() {
  const api = useIntroAsks();
  const [asking, setAsking] = useState<AskTarget | null>(null);

  /** `via` defaults to the row's own connector; the alternate is passed after a decline. */
  const ask = useCallback(
    (row: FounderInvestorRow, via: WarmIntrosV2ConnectorSummary = row.connector) => setAsking({ row, via }),
    [],
  );

  const modal = (
    <AskIntroModal
      target={asking}
      onClose={() => setAsking(null)}
      onSend={({ row, via }, blurb) => {
        api.send({
          investorUid: row.uid,
          status: 'requested',
          blurb,
          daysAgo: 0,
          via: via.profileUid === row.connector.profileUid ? undefined : via,
        });
        setAsking(null);
      }}
    />
  );

  return { ...api, ask, asking: !!asking, modal };
}
