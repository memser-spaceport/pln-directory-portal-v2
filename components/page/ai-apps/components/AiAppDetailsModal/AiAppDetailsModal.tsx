'use client';

import { Modal } from '@/components/common/Modal/Modal';
import { CloseIcon } from '@/components/icons';

import { PrdContent } from '../PrdContent';

import s from './AiAppDetailsModal.module.scss';

interface Props {
  isOpen: boolean;
  appName: string;
  /** One-pager text (Markdown or HTML). The caller gates on hasPrd(). */
  prd: string;
  onClose: () => void;
}

/**
 * Public "App Details" viewer — anyone who can see the list can open the
 * app's one-pager here. Rendering is delegated to PrdContent, which
 * sanitizes user-authored HTML and escapes HTML embedded in Markdown.
 */
export function AiAppDetailsModal({ isOpen, appName, prd, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modal}>
      <div className={s.content}>
        <div className={s.header}>
          <p className={s.title}>{appName}</p>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className={s.viewport}>
          <div className={s.page}>
            <PrdContent prd={prd} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
