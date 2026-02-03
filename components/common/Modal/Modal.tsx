'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import s from './Modal.module.scss';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  overlayClassname?: string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = (props) => {
  const { isOpen, onClose, children, closeOnBackdropClick = true, closeOnEscape = true, overlayClassname, className } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    if (isOpen && closeOnEscape) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, closeOnEscape]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={clsx(s.overlay, overlayClassname)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className={clsx(s.modalContainer, className)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Only render portal on client side
  if (!mounted) {
    return null;
  }

  return createPortal(modalContent, document.body);
};
