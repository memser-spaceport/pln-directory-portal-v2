'use client';

import { useState } from 'react';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { AiApp } from '@/services/ai-apps/ai-apps.service';
import { useDeleteAiApp } from '@/services/ai-apps/hooks/useDeleteAiApp';

import s from './DeleteAiAppDialog.module.scss';

interface Props {
  app: AiApp;
  onClose: () => void;
}

/**
 * Destructive confirm for deleting an app. Kept as its own isolated surface —
 * never a tab or a field next to the edit form — so a delete is always a
 * deliberate, single-purpose action. Single-flight: a second click while the
 * DELETE is in flight is a no-op, and a 404 (already gone) counts as done.
 */
export function DeleteAiAppDialog({ app, onClose }: Props) {
  const analytics = useAiAppsAnalytics();
  const { mutateAsync: deleteApp, isPending: isDeleting } = useDeleteAiApp(app.uid);
  const [error, setError] = useState<string | null>(null);

  const isDeploying = app.status === 'DEPLOYING';

  const handleConfirm = async () => {
    if (isDeleting) return;

    setError(null);
    const result = await deleteApp();
    if (!result.ok) {
      setError(result.error);
      analytics.onDeleteAppFailed(app.uid);
      return;
    }
    analytics.onDeleteAppConfirmed(app.uid, app.name);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} className={s.modal}>
      <div className={s.content}>
        <h2 className={s.title}>Delete &ldquo;{app.name}&rdquo;?</h2>
        <p className={s.body}>
          This removes the app and its deployment for everyone. Any 1-pager and stored secrets are deleted too. This
          can&rsquo;t be undone.
          {isDeploying && ' A deploy is currently in progress — it will be abandoned.'}
        </p>
        {error && <p className={s.error}>{error}</p>}
        <div className={s.actions}>
          <Button style="border" variant="neutral" size="s" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button style="fill" variant="error" size="s" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete app'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
