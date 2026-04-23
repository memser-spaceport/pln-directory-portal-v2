'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import s from './ActionConfirmModal.module.scss';

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const InfoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#1B4DFF" />
    <rect x="15" y="14" width="2" height="9" rx="1" fill="white" />
    <circle cx="16" cy="10.5" r="1.5" fill="white" />
  </svg>
);

interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDismiss: () => Promise<void>;
  title: string;
  description: string;
}

export const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onDismiss,
  title,
  description,
}) => {
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    if (isOpen) setDontShow(false);
  }, [isOpen]);

  const handleConfirm = async () => {
    if (dontShow) {
      try {
        await onDismiss();
      } catch (error) {
        console.error('Failed to update preferences:', error);
      }
    }
    onConfirm();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={s.overlay}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={s.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={s.closeButton} onClick={onClose} aria-label="Close modal">
              <CloseIcon />
            </button>

            <div className={s.iconWrapper}>
              <InfoIcon />
            </div>

            <div className={s.content}>
              <h2 className={s.title}>{title}</h2>
              <p className={s.description}>{description}</p>
              <label className={s.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={dontShow}
                  onChange={(e) => setDontShow(e.target.checked)}
                />
                Don&apos;t show this message again.
              </label>
              <button className={s.confirmButton} onClick={handleConfirm}>
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
