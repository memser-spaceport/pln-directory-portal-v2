'use client';

/**
 * The action strip at the foot of a grey warm-path card.
 *
 * Design changes on top of production (which has no feedback affordance on the
 * path card at all, and whose older sibling prototypes carry a pencil icon):
 *
 *   - The pencil is gone. Nothing on the card is editable — you're reporting
 *     that the graph is wrong — so the affordance is labelled `Give feedback`
 *     and opens a modal with room for a real description. It's a quiet text
 *     button, not a filled one: the card repeats for every alternate connector,
 *     and a rarely-used action shouldn't compete with the path itself.
 *
 *   - `Can you refer?` collapses the referral question until someone engages
 *     with it, then reveals Yes / No inline. Expanding costs a click, and buys
 *     a card that stays calm while you're reading paths.
 *
 *   - Answering replaces the question with the answer plus Undo, rather than
 *     resetting it — otherwise the same path gets answered repeatedly and the
 *     signal arrives duplicated.
 *
 *   - `No` asks no follow-up. The verdict is the signal; anyone with more to say
 *     already has `Give feedback` sitting on the same row, so a "Why not?" chip
 *     row was a second question competing with the affordance built to answer it.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/common/Button/Button';
import { CheckIcon } from '@/components/icons';
import { PathFeedbackModal, type PathContext, type PathFeedbackSubmission } from './PathFeedbackModal';
import f from './PathFeedback.module.scss';

type ReferVerdict = 'yes' | 'no';

type PathFeedbackRecord = {
  refer?: ReferVerdict;
  feedback?: PathFeedbackSubmission;
};

/**
 * Stands in for the mutation production would fire. Module-level so an answer
 * survives closing and re-opening the drawer within one session — the same
 * persistence the real thing would have, without a store.
 */
const FEEDBACK_STORE = new Map<string, PathFeedbackRecord>();

interface Props {
  /** Stable per-path id — also the key the caller should mount this under. */
  pathKey: string;
  context: PathContext;
}

export function PathActions({ pathKey, context }: Props) {
  const [record, setRecord] = useState<PathFeedbackRecord>(() => FEEDBACK_STORE.get(pathKey) ?? {});
  const [asking, setAsking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const save = (next: PathFeedbackRecord) => {
    FEEDBACK_STORE.set(pathKey, next);
    setRecord(next);
  };

  // Undo clears the referral answer only — a filed report is a separate thing
  // and shouldn't vanish with it.
  const reset = () => {
    save(record.feedback ? { feedback: record.feedback } : {});
    setAsking(false);
  };

  const connector = context.connectorName;
  const answered = record.refer;
  // Untouched, the strip is nothing but two text links in the corner. It only
  // claims real estate once someone has engaged with it.
  const resting = !answered && !asking;

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
              <Button style="border" variant="secondary" size="xxs" onClick={() => save({ ...record, refer: 'yes' })}>
                Yes
              </Button>
              <Button style="border" variant="secondary" size="xxs" onClick={() => save({ ...record, refer: 'no' })}>
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
              <Button style="link" variant="secondary" size="xxs" underline onClick={reset}>
                Undo
              </Button>
            </>
          ) : null}
        </div>

        <div className={f.stripRight}>
          {/* At rest this sits with `Give feedback` as a second quiet link —
              it's the rarer action of the two, so it gets no more weight than
              the escape hatch beside it. Clicking promotes the question to the
              left of the row, where Yes / No get real button affordance. */}
          {resting ? (
            <>
              <Button
                style="link"
                variant="secondary"
                size="xxs"
                underline
                aria-expanded={false}
                onClick={() => setAsking(true)}
              >
                Can you refer?
              </Button>
              <span className={f.linkDivider} aria-hidden>
                ·
              </span>
            </>
          ) : null}

          {record.feedback ? (
            <span className={f.answered}>
              <CheckIcon className={f.checkMark} width={11} height={11} />
              Feedback sent
            </span>
          ) : null}
          <Button style="link" variant="secondary" size="xxs" underline onClick={() => setModalOpen(true)}>
            {record.feedback ? 'Edit' : 'Give feedback'}
          </Button>
        </div>
      </div>

      <PathFeedbackModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        context={context}
        initial={record.feedback}
        onSubmit={(value) => {
          save({ ...record, feedback: value });
          setModalOpen(false);
        }}
      />
    </>
  );
}
