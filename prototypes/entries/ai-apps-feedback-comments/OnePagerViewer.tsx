'use client';

import { Modal } from '@/components/common/Modal/Modal';
import { ArrowUpRightIcon, CloseIcon } from '@/components/icons';

import type { OnePager } from './mocks';

import s from './OnePagerViewer.module.scss';

interface Props {
  isOpen: boolean;
  onePager: OnePager;
  onClose: () => void;
}

export function OnePagerViewer(props: Props) {
  const { isOpen, onePager, onClose } = props;

  const docUrl = onePager.fileUrl ?? onePager.previewDataUrl;

  // Open the 1-pager in its own tab. We write a wrapper doc rather than
  // navigating straight to the URL because browsers block top-level `data:`
  // navigation (the seeded preview is a data-URI); embedding it sidesteps that
  // and works the same for a real blob PDF.
  const openInNewTab = () => {
    if (!docUrl) return;
    const tab = window.open('', '_blank');
    if (!tab) return;
    const isPdf = !!onePager.fileUrl;
    const embed = isPdf
      ? `<iframe src="${docUrl}" style="border:0;position:fixed;inset:0;width:100%;height:100%"></iframe>`
      : `<img src="${docUrl}" alt="" style="display:block;margin:24px auto;max-width:900px;width:100%;height:auto"/>`;
    tab.document.write(
      `<!doctype html><meta charset="utf-8"><title>${onePager.fileName}</title>` +
        `<body style="margin:0;background:#f6f8fb">${embed}</body>`,
    );
    tab.document.close();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modal}>
      <div className={s.content}>
        <div className={s.header}>
          <p className={s.fileName}>{onePager.fileName}</p>
          <div className={s.headerActions}>
            {docUrl && (
              <button type="button" className={s.openTab} onClick={openInNewTab}>
                <ArrowUpRightIcon width={16} height={16} />
                Open in new tab
              </button>
            )}
            <button type="button" className={s.close} onClick={onClose} aria-label="Close">
              <CloseIcon width={20} height={20} />
            </button>
          </div>
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
