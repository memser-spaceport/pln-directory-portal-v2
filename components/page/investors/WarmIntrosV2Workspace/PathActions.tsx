'use client';

/**
 * Action strip at the foot of a grey warm-path card: "Can you refer?" + "Give feedback" + notes.
 * Promoted from prototypes/entries/warm-intros-v2; persists via WarmPathV2Feedback / WarmPathV2Note APIs.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { useMcpAnalytics } from '@/analytics/mcp.analytics';
import { Button } from '@/components/common/Button/Button';
import { CheckIcon } from '@/components/icons';
import { useWarmPathV2Feedback } from '@/services/investors/hooks/useWarmPathV2Feedback';
import { useWarmPathV2Note } from '@/services/investors/hooks/useWarmPathV2Note';
import type {
  WarmPathFeedbackSummary,
  WarmPathMyFeedback,
  WarmPathMyNote,
  WarmPathNoteRecent,
} from '@/services/investors/warm-intros-v2.types';
import { PathFeedbackModal, type PathContext } from './PathFeedbackModal';
import { PathFeedbackAdminSummary } from './PathFeedbackAdminSummary';
import { PathNoteModal } from './PathNoteModal';
import { PathNotesAdminSummary } from './PathNotesAdminSummary';
import f from './PathFeedback.module.scss';

type ReferVerdict = 'yes' | 'no';

/** Temporarily hidden — re-enable when refer flow ships. */
const SHOW_CAN_REFER = false;
const OWN_NOTE_PREVIEW_MAX = 120;

interface Props {
  warmPathUid: string;
  connectorProfileUid: string;
  investorProfileUid: string;
  targetSet?: string | null;
  context: PathContext;
  myFeedback?: WarmPathMyFeedback | null;
  feedbackSummary?: WarmPathFeedbackSummary | null;
  myNote?: WarmPathMyNote | null;
  notes?: WarmPathNoteRecent[] | null;
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
  myNote,
  notes,
  canEdit = false,
}: Props) {
  const analytics = useMcpAnalytics();
  const { upsert, clearRefer } = useWarmPathV2Feedback({
    investorProfileUid,
    targetSet,
  });
  const { upsert: upsertNote } = useWarmPathV2Note({
    investorProfileUid,
    targetSet,
  });
  const [asking, setAsking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  const answered = (myFeedback?.canRefer as ReferVerdict | null | undefined) ?? undefined;
  const hasNote = !!(myFeedback?.note && myFeedback.note.trim());
  const ownNoteText = myNote?.note?.trim() || '';
  const hasOwnNote = ownNoteText.length > 0;
  const resting = !answered && !asking;
  const connector = context.connectorName;
  const busy = upsert.isPending || clearRefer.isPending || upsertNote.isPending;

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
        {SHOW_CAN_REFER ? (
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
        ) : null}

        <div className={f.stripRight}>
          {SHOW_CAN_REFER && resting ? (
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
            onClick={() => {
              analytics.onWarmPathFeedbackOpened({ warmPathUid, investorProfileUid, isEdit: hasNote });
              setModalOpen(true);
            }}
          >
            {hasNote ? 'Edit' : 'Give feedback'}
          </Button>
          <span className={f.linkDivider} aria-hidden>
            ·
          </span>
          <Button
            style="link"
            variant="secondary"
            size="xxs"
            underline
            disabled={busy}
            onClick={() => {
              analytics.onWarmPathNoteOpened({ warmPathUid, investorProfileUid, isEdit: hasOwnNote });
              setNoteModalOpen(true);
            }}
          >
            {hasOwnNote ? 'Edit note' : 'Add note'}
          </Button>
        </div>
      </div>

      {hasOwnNote ? (
        <p className={f.ownNote}>
          {ownNoteText.slice(0, OWN_NOTE_PREVIEW_MAX)}
          {ownNoteText.length > OWN_NOTE_PREVIEW_MAX ? '…' : ''}
        </p>
      ) : null}

      {canEdit && feedbackSummary ? <PathFeedbackAdminSummary summary={feedbackSummary} /> : null}
      {canEdit && notes && notes.length > 0 ? <PathNotesAdminSummary notes={notes} /> : null}

      <PathFeedbackModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        context={context}
        initial={hasNote && myFeedback?.note ? { note: myFeedback.note } : undefined}
        onSubmit={(value) => {
          upsert.mutate(
            {
              warmPathUid,
              body: { connectorProfileUid, note: value.note },
            },
            {
              onSuccess: () => {
                analytics.onWarmPathFeedbackSubmitted({ warmPathUid, investorProfileUid, isEdit: hasNote });
              },
            },
          );
          setModalOpen(false);
        }}
      />

      <PathNoteModal
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        context={context}
        initial={hasOwnNote ? { note: ownNoteText } : undefined}
        onSubmit={(value) => {
          upsertNote.mutate(
            {
              warmPathUid,
              body: { connectorProfileUid, note: value.note },
            },
            {
              onSuccess: () => {
                analytics.onWarmPathNoteSubmitted({ warmPathUid, investorProfileUid, isEdit: hasOwnNote });
              },
            },
          );
          setNoteModalOpen(false);
        }}
        onClear={
          hasOwnNote
            ? () => {
                upsertNote.mutate(
                  {
                    warmPathUid,
                    body: { connectorProfileUid, note: null },
                  },
                  {
                    onSuccess: () => {
                      analytics.onWarmPathNoteCleared({ warmPathUid, investorProfileUid });
                    },
                  },
                );
                setNoteModalOpen(false);
              }
            : undefined
        }
      />
    </>
  );
}
