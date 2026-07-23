'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  /** Opt-in dialog semantics: renders role="dialog" + aria-modal on the container,
   *  labelled by the given element id. Pair with `inertBackground` — aria-modal
   *  promises containment that roles alone don't deliver. */
  ariaLabelledBy?: string;
  /** Opt-in: hide body overflow while open, restoring the previous inline value. */
  lockScroll?: boolean;
  /** Opt-in: set `inert` on the modal's body-level siblings while open, so Tab and
   *  screen readers can't reach the background page (WAI-ARIA APG containment). */
  inertBackground?: boolean;
}

export const Modal: React.FC<ModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    children,
    closeOnBackdropClick = true,
    closeOnEscape = true,
    overlayClassname,
    className,
    ariaLabelledBy,
    lockScroll = false,
    inertBackground = false,
  } = props;
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !lockScroll) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen, lockScroll]);

  useEffect(() => {
    if (!isOpen || !inertBackground) return;
    // The portal renders the overlay as a direct child of <body>; everything
    // else at that level is background. Only touch elements we actually flip,
    // so stacked dialogs / already-inert nodes are left alone on cleanup.
    const overlay = overlayRef.current;
    const flipped: HTMLElement[] = [];
    for (const el of Array.from(document.body.children)) {
      if (!(el instanceof HTMLElement)) continue;
      if (el === overlay || el.contains(overlay) || el.inert) continue;
      el.inert = true;
      flipped.push(el);
    }
    return () => {
      for (const el of flipped) el.inert = false;
    };
  }, [isOpen, inertBackground]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape || !onClose) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener('keydown', handleEscape, true);
    return () => document.removeEventListener('keydown', handleEscape, true);
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
          ref={overlayRef}
          className={clsx(s.overlay, overlayClassname)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className={clsx(s.modalContainer, className)}
            role={ariaLabelledBy ? 'dialog' : undefined}
            aria-modal={ariaLabelledBy ? true : undefined}
            aria-labelledby={ariaLabelledBy}
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
