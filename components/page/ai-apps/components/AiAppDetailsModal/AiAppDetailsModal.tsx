'use client';

import { Modal } from '@/components/common/Modal/Modal';
import { CloseIcon } from '@/components/icons';
import { Spinner } from '@/components/ui/Spinner';
import { useAiAppPrdContent } from '@/services/ai-apps/hooks/useAiAppPrdContent';

import { PrdContent } from '../PrdContent';

import s from './AiAppDetailsModal.module.scss';

interface Props {
  isOpen: boolean;
  appName: string;
  /** URL to the stored one-pager file (Markdown or HTML). The caller gates on hasPrd(). */
  prdUrl: string;
  onClose: () => void;
}

/**
 * Public "App Details" viewer — anyone who can see the list can open the
 * app's one-pager here. The one-pager itself lives at `prdUrl` (S3); it's
 * fetched through our own API route (the bucket has no CORS policy) and
 * rendering is delegated to PrdContent, which sanitizes user-authored HTML
 * and escapes HTML embedded in Markdown.
 */
export function AiAppDetailsModal({ isOpen, appName, prdUrl, onClose }: Props) {
  const { content, error, isLoading } = useAiAppPrdContent(prdUrl, { enabled: isOpen });

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
          {isLoading ? (
            <Spinner />
          ) : error || content === null ? (
            <p className={s.errorText}>{error ?? 'One-pager could not be loaded'}</p>
          ) : (
            <div className={s.page}>
              <PrdContent prd={content} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
