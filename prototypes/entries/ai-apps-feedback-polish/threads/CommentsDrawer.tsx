'use client';

import { type PropsWithChildren, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Production Drawer's container chrome (white full-height column, left shadow,
// 100vw on phones), imported by class.
import dr from '@/components/common/Drawer/Drawer.module.scss';

import s from './CommentsDrawer.module.scss';

export const COMMENTS_DRAWER_WIDTH = 380;

interface Props {
  isOpen: boolean;
}

/**
 * The comments list, in a drawer on the right.
 *
 * Production's `Drawer` minus its overlay: same container class, same 300ms
 * slide from the right. The overlay is the one part that can't come along —
 * it dims the page and closes on an outside click, and comment mode is a tool
 * you use *on* that page: clicking the app beside the list is how a comment is
 * placed. So the drawer is non-modal, and the page makes room for it (the shell
 * reserves its width at ≥960) instead of being covered.
 *
 * Closing lives in the list's own header ✕ and Esc (the layer's), so this
 * takes no onClose.
 */
export function CommentsDrawer({ isOpen, children }: PropsWithChildren<Props>) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`${dr.container} ${s.drawer}`}
          style={{ width: COMMENTS_DRAWER_WIDTH }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
