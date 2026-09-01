'use client';

import React, { PropsWithChildren, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import s from './Drawer.module.scss';
import clsx from 'clsx';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number;
  fullScreen?: boolean;
  noBlur?: boolean;
  /**
   * The scrolling element.
   *
   * This container is what overflows, not the content inside it — the sticky
   * header and footer stick to it — so a caller that needs to reset the scroll
   * position has no way to reach it from its own children. Optional and inert
   * for everyone who doesn't ask.
   */
  containerRef?: React.Ref<HTMLDivElement>;
}

export function Drawer(props: PropsWithChildren<DrawerProps>) {
  const { isOpen, onClose, children, width = 720, fullScreen, noBlur, containerRef } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={clsx(s.overlay, {
            [s.noBlur]: noBlur,
          })}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <motion.div
            ref={containerRef}
            className={`${s.container} ${fullScreen ? s.fullScreen : ''}`}
            style={fullScreen ? undefined : { width }}
            initial={fullScreen ? { opacity: 0 } : { x: '100%' }}
            animate={fullScreen ? { opacity: 1 } : { x: 0 }}
            exit={fullScreen ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document?.body,
  );
}
