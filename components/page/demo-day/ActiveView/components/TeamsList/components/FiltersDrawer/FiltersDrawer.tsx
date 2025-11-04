import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filters } from '../../../Filters';
import { useFilterStore } from '@/services/members/store';
import s from './FiltersDrawer.module.scss';

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FiltersDrawer: React.FC<FiltersDrawerProps> = ({ isOpen, onClose }) => {
  const { clearParams } = useFilterStore();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClearAll = () => {
    clearParams();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={s.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className={s.drawer}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className={s.drawerContent}>
              {/* Filters Content */}
              <div className={s.filtersWrapper}>
                <Filters />
              </div>

              {/* Footer with Clear All and Close buttons */}
              <div className={s.footer}>
                <button className={s.clearButton} onClick={handleClearAll}>
                  Clear all
                </button>
                <button className={s.closeButton} onClick={onClose}>
                  <CloseIcon />
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
