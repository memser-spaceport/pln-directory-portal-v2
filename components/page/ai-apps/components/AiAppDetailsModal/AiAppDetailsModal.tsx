'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { Modal } from '@/components/common/Modal/Modal';
import { ArrowUpRightIcon, CloseIcon } from '@/components/icons';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { fetchAiAppPrdContent } from '@/services/ai-apps/ai-apps.service';
import { useAiAppPrdContent } from '@/services/ai-apps/hooks/useAiAppPrdContent';

import { PrdViewerBody } from '../PrdViewerBody';

import s from './AiAppDetailsModal.module.scss';

interface Props {
  isOpen: boolean;
  uid: string;
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
export function AiAppDetailsModal({ isOpen, uid, appName, prdUrl, onClose }: Props) {
  const { content, error, isLoading } = useAiAppPrdContent(prdUrl, { enabled: isOpen });
  const analytics = useAiAppsAnalytics();
  const queryClient = useQueryClient();

  const prdHref = `/pl-infra/ai-apps/${encodeURIComponent(uid)}/prd`;

  // Priming just the (slower, S3-proxied) PRD content query — the new page's
  // own useAiApp(uid) call is a lightweight metadata fetch not worth seeding
  // with a synthetic partial AiApp object here.
  const primeCache = () => {
    queryClient.prefetchQuery({
      queryKey: [AiAppsQueryKeys.AI_APP_PRD_CONTENT, prdUrl],
      queryFn: () => fetchAiAppPrdContent(prdUrl),
    });
  };

  const handleOpenInNewTabClick = () => {
    try {
      analytics.onPrdOpenInNewTabClicked(uid, appName);
    } catch {
      // A broken analytics client must never block the link's native navigation.
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modal}>
      <div className={s.content}>
        <div className={s.header}>
          <p className={s.title}>{appName}</p>
          <div className={s.headerActions}>
            <a
              href={prdHref}
              target="_blank"
              rel="noopener noreferrer"
              className={s.openTab}
              onMouseEnter={primeCache}
              onPointerDown={primeCache}
              onClick={handleOpenInNewTabClick}
            >
              <ArrowUpRightIcon width={16} height={16} />
              Open in new tab
            </a>
            <button type="button" className={s.close} onClick={onClose} aria-label="Close">
              <CloseIcon width={20} height={20} />
            </button>
          </div>
        </div>

        <div className={s.viewport}>
          <PrdViewerBody isLoading={isLoading} error={error} content={content} />
        </div>
      </div>
    </Modal>
  );
}
