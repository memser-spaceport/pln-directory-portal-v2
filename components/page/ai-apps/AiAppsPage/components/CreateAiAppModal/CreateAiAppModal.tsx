'use client';

import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';

import { STEPS } from './constants';

import { handleDownloadKit } from './utils/handleDownloadKit';

import s from './CreateAiAppModal.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAiAppModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={s.content}>
        <div className={s.header}>
          <h2 className={s.title}>Create AI App</h2>
        </div>

        <div className={s.body}>
          <p className={s.subtitle}>Step-by-Step Guide</p>
          <ol className={s.steps}>
            {STEPS.map((step, i) => (
              <li key={i}>
                <strong>{step.title}:</strong> {step.description}
              </li>
            ))}
          </ol>
        </div>

        <div className={s.footer}>
          <Button size="s" style="border" variant="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button size="s" onClick={handleDownloadKit}>
            Download Starter Kit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
