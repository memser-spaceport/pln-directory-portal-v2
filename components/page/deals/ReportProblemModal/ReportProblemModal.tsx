'use client';

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon, WarningCircleIcon } from '@/components/icons';
import { useReportProblemModalStore } from '@/services/deals/store';
import { useReportDealIssue } from '@/services/deals/hooks/useReportDealIssue';

import s from './ReportProblemModal.module.scss';

export function ReportProblemModal() {
  const { open, dealUid, actions } = useReportProblemModalStore();
  const { mutate, isPending } = useReportDealIssue(dealUid || '');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const onClose = () => {
    setDescription('');
    setError('');
    actions.closeModal();
  };

  const onSubmit = () => {
    if (!description.trim()) {
      setError('Please describe the issue.');
      return;
    }
    mutate(description.trim(), {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className={s.root}>
        <div className={s.content}>
          <div className={s.iconWrapper}>
            <WarningCircleIcon width={32} height={32} color="#1b4dff" />
          </div>
          <h2 className={s.title}>Report a problem</h2>
          <div className={s.fieldGroup}>
            <label className={s.fieldLabel}>Describe the issue</label>
            <textarea
              className={s.textarea}
              placeholder="e.g. The redemption code is no longer valid, the link is broken, the offer terms have changed"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (error) setError('');
              }}
            />
            {error && <span className={s.errorText}>{error}</span>}
          </div>
        </div>
        <div className={s.footer}>
          <Button style="border" variant="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
        <button type="button" className={s.closeButton} onClick={onClose}>
          <CloseIcon width={16} height={16} color="#0a0c11" />
        </button>
      </div>
    </Modal>
  );
}
