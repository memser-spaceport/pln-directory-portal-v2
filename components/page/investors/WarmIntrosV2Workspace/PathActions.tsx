'use client';

/**
 * Action strip at the foot of a grey warm-path card: "Can you refer?" + "Give feedback".
 * Promoted from prototypes/entries/warm-intros-v2; persists via WarmPathV2Feedback API.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/common/Button/Button';
import { CheckIcon } from '@/components/icons';
import { useWarmPathV2Feedback } from '@/services/investors/hooks/useWarmPathV2Feedback';
import type { WarmPathFeedbackSummary, WarmPathMyFeedback } from '@/services/investors/warm-intros-v2.types';
import { PathFeedbackModal, type PathContext } from './PathFeedbackModal';
import { PathFeedbackAdminSummary } from './PathFeedbackAdminSummary';
import f from './PathFeedback.module.scss';

type ReferVerdict = 'yes' | 'no';

interface Props {
  warmPathUid: string;
  connectorProfileUid: string;
  investorProfileUid: string;
  targetSet?: string | null;
  context: PathContext;
  myFeedback?: WarmPathMyFeedback | null;
  feedbackSummary?: WarmPathFeedbackSummary | null;
  canEdit?: boolean;
}

export function PathActions({
  warmPathUid,
  connectorProfileUid,
  investorProfileUid,
  targetSet,
  context,
  myFeedback,
  feedbackSummary,
  canEdit = false,
}: Props) {
  const { upsert, clearRefer } = useWarmPathV2Feedback({
    investorProfileUid,
    targetSet,
  });
  const [asking, setAsking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const answered = (myFeedback?.canRefer as ReferVerdict | null | undefined) ?? undefined;
  const hasNote = !!(myFeedback?.note && myFeedback.note.trim());
  const resting = !answered && !asking;
  const connector = context.connectorName;
  const busy = upsert.isPending || clearRefer.isPending;

  const setRefer = (verdict: ReferVerdict) => {
    upsert.mutate({
      warmPathUid,
      body: { connectorProfileUid, canRefer: verdict },
    });
    setAsking(false);
  };

  const reset = () => {
    clearRefer.mutate({ warmPathUid, connectorProfileUid });
    setAsking(false);
  };

  return (
    <>
      <div className={f.strip}>
        <div className={f.stripLeft}>
          {asking && !answered ? (
            <>
              <span className={f.askLabel}>
                Can you refer
                {connector ? (
                  <>
                    {' via '}
                    <span className={f.askName}>{connector}</span>
                  </>
                ) : null}
                ?
              </span>
              <Button style="border" variant="secondary" size="xxs" disabled={busy} onClick={() => setRefer('yes')}>
                Yes
              </Button>
              <Button style="border" variant="secondary" size="xxs" disabled={busy} onClick={() => setRefer('no')}>
                No
              </Button>
            </>
          ) : null}

          {answered ? (
            <>
              <span className={clsx(f.answered, answered === 'no' && f.answeredNo)}>
                <CheckIcon className={f.checkMark} width={11} height={11} />
                {answered === 'yes'
                  ? `You can refer${connector ? ` via ${connector}` : ''}`
                  : 'You can’t refer on this path'}
              </span>
              <Button style="link" variant="secondary" size="xxs" underline disabled={busy} onClick={reset}>
                Undo
              </Button>
            </>
          ) : null}
        </div>

        <div className={f.stripRight}>
          {resting ? (
            <>
              <Button
                style="link"
                variant="secondary"
                size="xxs"
                underline
                aria-expanded={false}
                disabled={busy}
                onClick={() => setAsking(true)}
              >
                Can you refer?
              </Button>
              <span className={f.linkDivider} aria-hidden>
                ·
              </span>
            </>
          ) : null}

          {hasNote ? (
            <span className={f.answered}>
              <CheckIcon className={f.checkMark} width={11} height={11} />
              Feedback sent
            </span>
          ) : null}
          <Button
            style="link"
            variant="secondary"
            size="xxs"
            underline
            disabled={busy}
            onClick={() => setModalOpen(true)}
          >
            {hasNote ? 'Edit' : 'Give feedback'}
          </Button>
        </div>
      </div>

      {canEdit && feedbackSummary ? <PathFeedbackAdminSummary summary={feedbackSummary} /> : null}

      <PathFeedbackModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        context={context}
        initial={hasNote && myFeedback?.note ? { note: myFeedback.note } : undefined}
        onSubmit={(value) => {
          upsert.mutate({
            warmPathUid,
            body: { connectorProfileUid, note: value.note },
          });
          setModalOpen(false);
        }}
      />
    </>
  );
}
