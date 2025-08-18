'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './MobileDrawer.module.scss';
import { clsx } from 'clsx';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, title, children, className }) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const drawerContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={clsx(styles.drawer, className)} onClick={(e) => e.stopPropagation()}>
        {/* Handle bar */}
        <div className={styles.handle} />

        {/* Header */}
        {title && (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button className={styles.closeButton} onClick={onClose} aria-label="Close drawer">
              <CloseIcon />
            </button>
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );

  // Render in portal to ensure it's on top of everything
  return typeof window !== 'undefined' ? createPortal(drawerContent, document.body) : null;
};

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
