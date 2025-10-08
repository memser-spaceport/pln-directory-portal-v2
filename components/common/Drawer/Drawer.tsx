import React, { PropsWithChildren } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import s from './Drawer.module.scss';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Drawer(props: PropsWithChildren<DrawerProps>) {
  const { isOpen, onClose, children } = props;

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
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <motion.div
            className={s.container}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
