'use client';

import { useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { CloseIcon } from '@/components/icons';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

import { AppSecretsPanel } from '../AppSecretsPanel';

import s from './UpdateSecretsModal.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  app: AiApp;
  /** Forwarded from AppSecretsPanel so the page can swap the iframe for its progress state. */
  onDeployingChange?: (deploying: boolean) => void;
}

/**
 * "Update secrets & redeploy" dialog wrapping AppSecretsPanel. While a deploy is
 * in flight the modal locks (no backdrop/escape/close) — unmounting the panel
 * mid-deploy would orphan the request and the page would never learn it settled.
 * On success it closes itself; on failure it stays open showing the panel error.
 */
export function UpdateSecretsModal(props: Props) {
  const { isOpen, onClose, app, onDeployingChange } = props;

  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeployingChange = (deploying: boolean) => {
    setIsDeploying(deploying);
    onDeployingChange?.(deploying);
  };

  const handleClose = () => {
    if (isDeploying) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnBackdropClick={!isDeploying}
      closeOnEscape={!isDeploying}
      className={s.modal}
    >
      <div className={s.content}>
        <div className={s.header}>
          <h2 className={s.title}>Update secrets &amp; redeploy</h2>
          <button
            type="button"
            className={s.closeButton}
            onClick={handleClose}
            disabled={isDeploying}
            aria-label="Close"
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className={s.body}>
          <AppSecretsPanel app={app} onDeployingChange={handleDeployingChange} onDeploySuccess={onClose} />
        </div>
      </div>
    </Modal>
  );
}
