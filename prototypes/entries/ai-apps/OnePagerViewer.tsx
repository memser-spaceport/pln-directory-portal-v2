'use client';

import { Modal } from '@/components/common/Modal/Modal';
import { CloseIcon } from '@/components/icons';

import type { OnePager } from './mocks';

import s from './OnePagerViewer.module.scss';

interface Props {
  isOpen: boolean;
  onePager: OnePager;
  onClose: () => void;
}

export function OnePagerViewer(props: Props) {
  const { isOpen, onePager, onClose } = props;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modal}>
      <div className={s.content}>
        <div className={s.header}>
          <p className={s.fileName}>{onePager.fileName}</p>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className={s.viewport}>
          {onePager.fileUrl ? (
            <iframe className={s.pdfFrame} src={onePager.fileUrl} title={onePager.fileName} />
          ) : onePager.previewDataUrl ? (
            <img className={s.previewImg} src={onePager.previewDataUrl} alt={onePager.fileName} />
          ) : (
            <p className={s.fallback}>Preview unavailable.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
