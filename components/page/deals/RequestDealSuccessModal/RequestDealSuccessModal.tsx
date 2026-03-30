'use client';

import { useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon, ConfettiIcon } from '@/components/icons';
import { useRequestDealModalStore } from '@/services/deals/store';
import { useDealsAnalytics } from '@/analytics/deals.analytics';

import s from './RequestDealSuccessModal.module.scss';

export function RequestDealSuccessModal() {
  const { successOpen, actions } = useRequestDealModalStore();
  const { trackRequestModalClosed } = useDealsAnalytics();

  useEffect(() => {
    if (successOpen) {
      trackRequestModalClosed();
    }
  }, [successOpen, trackRequestModalClosed]);

  const handleClose = () => {
    actions.closeSuccess();
  };

  return (
    <Modal isOpen={successOpen} onClose={handleClose}>
      <div className={s.root}>
        <div className={s.content}>
          <div className={s.iconWrapper}>
            <ConfettiIcon width={32} height={32} color="#1b4dff" />
          </div>
          <h2 className={s.title}>Request Submitted</h2>
          <p className={s.description}>
            {"Thanks — this helps us prioritize new deals for the network. We'll reach out if we need more details."}
          </p>
        </div>
        <Button className={s.fullWidthButton} onClick={handleClose}>
          Back to Deals
        </Button>
        <button type="button" className={s.closeButton} onClick={handleClose}>
          <CloseIcon width={16} height={16} color="#0a0c11" />
        </button>
      </div>
    </Modal>
  );
}
