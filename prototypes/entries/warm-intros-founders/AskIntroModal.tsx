'use client';

/**
 * "Ask for intro" — the founder's half of the consent step.
 *
 * Chrome is the shared content-modal shell (Modal + SubmitDealModal styles),
 * the same one warm-intros-v2's PathFeedbackModal wears. One field: the blurb
 * the connector can forward as written. It opens drafted, because the blank
 * page is what stops a founder asking — and the bracketed gap is the one line
 * the draft cannot write for them.
 *
 * The ask goes to the CONNECTOR, never to the investor. The footer line says
 * the two things the interface cannot otherwise show: who decides, and that
 * the investor's contact details are not part of this.
 */

import { useState } from 'react';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import m from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import t from '@/components/form/FormTextArea/FormTextArea.module.scss';
import type { WarmIntrosV2ConnectorSummary } from '@/services/investors/warm-intros-v2.types';

import { ConnectorChip } from './InvestorPathRow';
import { draftBlurb, tieLine, type FounderInvestorRow } from './mocks';
import s from './WarmIntrosFounders.module.scss';

export type AskTarget = { row: FounderInvestorRow; via: WarmIntrosV2ConnectorSummary };

const BLURB_MAX = 600;

interface Props {
  /** The investor, and who is being asked — the row's connector, or its alternate after a decline. */
  target: AskTarget | null;
  onClose: () => void;
  onSend: (target: AskTarget, blurb: string) => void;
}

export function AskIntroModal({ target, onClose, onSend }: Props) {
  return (
    <Modal
      isOpen={!!target}
      onClose={onClose}
      closeOnEscape
      closeOnBackdropClick={false}
      ariaLabelledBy="wif-ask-title"
      lockScroll
      inertBackground
    >
      {target && <AskForm key={target.row.uid} target={target} onClose={onClose} onSend={onSend} />}
    </Modal>
  );
}

function AskForm({ target, onClose, onSend }: { target: AskTarget } & Omit<Props, 'target'>) {
  const { row, via } = target;
  const tie = tieLine(row, via);
  const [blurb, setBlurb] = useState(() => draftBlurb(row));
  const connectorFirst = via.name.split(' ')[0];
  const canSend = blurb.trim().length > 0;

  return (
    <div className={m.root}>
      <div className={m.header}>
        <div className={m.headerText}>
          <h2 id="wif-ask-title" className={m.title}>
            Ask {connectorFirst} for an intro
          </h2>
          <p className={m.subtitle}>
            To {row.name}
            {row.firm ? `, ${row.firm}` : ''}
          </p>
        </div>
        <button type="button" className={m.closeButton} onClick={onClose} aria-label="Close">
          <CloseIcon width={20} height={20} color="#0a0c11" />
        </button>
      </div>

      <div className={m.content}>
        <div className={m.form}>
          <div className={s.path}>
            <ConnectorChip name="You" />
            <span className={s.pathArrow} aria-hidden>
              →
            </span>
            <ConnectorChip name={via.name} />
            <span className={s.pathArrow} aria-hidden>
              →
            </span>
            <ConnectorChip name={row.name} />
            {tie && <p className={s.pathReason}>{tie}</p>}
          </div>

          <div className={m.fieldGroup}>
            <div className={t.labelWrapper}>
              <label className={t.label} htmlFor="wif-ask-blurb">
                What {connectorFirst} can forward
              </label>
            </div>
            <div className={t.input}>
              <div className={t.inputContent}>
                <textarea
                  id="wif-ask-blurb"
                  className={t.inputElement}
                  rows={7}
                  maxLength={BLURB_MAX}
                  value={blurb}
                  onChange={(e) => setBlurb(e.target.value)}
                />
              </div>
            </div>
            <div className={t.descriptionRow}>
              <span className={m.helperText}>Written so it can be forwarded as is.</span>
              <span className={t.counter}>
                {blurb.length} / {BLURB_MAX}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={m.footer}>
        <p className={m.footerNote}>
          {`${connectorFirst} decides whether to make the intro. ${row.name.split(' ')[0]} isn’t contacted until then.`}
        </p>
        <div className={m.footerActions}>
          <Button style="border" variant="secondary" size="s" onClick={onClose}>
            Cancel
          </Button>
          <Button
            style="fill"
            variant="primary"
            size="s"
            disabled={!canSend}
            onClick={() => onSend(target, blurb.trim())}
          >
            Send request
          </Button>
        </div>
      </div>
    </div>
  );
}
