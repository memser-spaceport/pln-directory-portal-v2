'use client';

import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';

import { MODAL_INTRO, SECURITY_NOTE, STEPS } from './constants';

import { handleDownloadKit } from './utils/handleDownloadKit';

import s from './CreateAiAppModal.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAiAppModal({ isOpen, onClose }: Props) {
  const analytics = useAiAppsAnalytics();

  const handleDownload = async () => {
    const success = await handleDownloadKit();
    if (success) {
      analytics.onStarterKitDownloaded();
    } else {
      analytics.onStarterKitDownloadFailed();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modalWide}>
      <div className={s.content}>
        <div className={s.header}>
          <h2 className={s.modalTitle}>Add your AI App</h2>
          <button type="button" className={s.modalClose} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className={s.body}>
          <div className={s.guideHeader}>
            <p className={s.stepsHeading}>Step-by-Step Guide</p>
            <p className={s.intro}>{MODAL_INTRO}</p>
          </div>
          <ol className={s.steps}>
            {STEPS.map((step, i) => (
              <li key={i}>
                <strong>{step.title}:</strong> {step.description}
              </li>
            ))}
          </ol>
        </div>

        <div className={s.footer}>
          <div className={s.securityNote}>
            <img className={s.securityNoteIcon} src="/icons/lock-grey.svg" alt="" />
            <p className={s.securityNoteText}>{SECURITY_NOTE}</p>
          </div>
          <div className={s.footerActions}>
            <Button size="s" style="border" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button size="s" onClick={handleDownload}>
              Download Starter Kit
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
