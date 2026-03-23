'use client';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon, ConfettiIcon } from '@/components/icons';
import { useSubmitDealModalStore } from '@/services/deals/store';

import s from './SubmitDealSuccessModal.module.scss';

export function SubmitDealSuccessModal() {
  const { successOpen, actions } = useSubmitDealModalStore();

  return (
    <Modal isOpen={successOpen} onClose={actions.closeSuccess}>
      <div className={s.root}>
        <div className={s.content}>
          <div className={s.iconWrapper}>
            <ConfettiIcon width={32} height={32} />
          </div>
          <h2 className={s.title}>Deal Submitted</h2>
          <p className={s.description}>
            Thanks for sharing a deal with the Protocol Labs network. Our team will review your submission before
            publishing it in the Deals catalog.
            <br />
            <br />
            If we need additional details, we may reach out to you by the contact method provided.
          </p>
        </div>
        <Button className={s.fullWidthButton} onClick={actions.closeSuccess}>Back to Deals</Button>
        <button type="button" className={s.closeButton} onClick={actions.closeSuccess}>
          <CloseIcon width={16} height={16} color="#0a0c11" />
        </button>
      </div>
    </Modal>
  );
}
