'use client';

import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { ConfettiIcon } from '@/components/icons/ConfettiIcon';
import s from './RequestGuideSuccessModal.module.scss';

interface Props {
  isOpen: boolean;
  topic: string;
  onClose: () => void;
}

export default function RequestGuideSuccessModal({ isOpen, topic, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={s.root}>
        <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className={s.content}>
          <div className={s.iconWrap}>
            <ConfettiIcon />
          </div>
          <div className={s.text}>
            <p className={s.title}>Request Submitted</p>
            <p className={s.body}>
              {`We've logged your request for "${topic}". Our experts review submissions regularly and publish based on what founders ask most.`}
            </p>
          </div>
        </div>

        <div className={s.footer}>
          <button type="button" className={s.backBtn} onClick={onClose}>
            Back to Founders Guide
          </button>
        </div>
      </div>
    </Modal>
  );
}
