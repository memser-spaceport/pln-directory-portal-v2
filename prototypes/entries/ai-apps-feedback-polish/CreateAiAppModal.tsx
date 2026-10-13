'use client';

import { useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { CloseIcon } from '@/components/icons';

import {
  createModalIntro,
  createModalSecurityNote,
  createModalSteps,
  createModalWhatsNewSections,
  mockStarterKitVersion,
} from './mocks';

import s from '@/components/page/ai-apps/AiAppsPage/components/CreateAiAppModal/CreateAiAppModal.module.scss';

interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function CreateAiAppModal({ isOpen, onClose }: Props) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    const blob = new Blob(
      [
        'Prototype starter kit placeholder.\n\n',
        'This mock download keeps the AI Apps prototype fully local and does not call the starter-kit API.\n',
      ],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-app-starter-kit-v${mockStarterKitVersion}-prototype.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setDownloaded(true);
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
          <div className={s.guide}>
            <p className={s.stepsHeading}>Step-by-Step Guide</p>
            <p className={s.intro}>{createModalIntro}</p>
            <ol className={s.steps}>
              {createModalSteps.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}:</strong> {step.description}
                </li>
              ))}
            </ol>
          </div>

          <aside className={s.whatsNew} aria-label="What's new">
            {createModalWhatsNewSections.map((section) => (
              <div key={section.version} className={s.whatsNewSection}>
                <p className={s.whatsNewLabel}>What&apos;s new in v{section.version}</p>
                <ul className={s.whatsNewList}>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>
        </div>

        <div className={s.footer}>
          <div className={s.securityNote} aria-live="polite">
            <span className={s.securityNoteIcon} aria-hidden>
              !
            </span>
            <p className={s.securityNoteText}>
              {downloaded ? 'Prototype download created locally.' : createModalSecurityNote}
            </p>
          </div>
          <div className={s.footerActions}>
            <Button size="s" style="border" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button size="s" onClick={handleDownload}>
              Download Starter Kit v{mockStarterKitVersion}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
