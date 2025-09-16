import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import s from './SuccessAlert.module.scss';

const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#0A9952" />
    <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface SuccessAlertProps {
  isVisible: boolean;
  onClose: () => void;
  message?: string;
}

export const SuccessAlert: React.FC<SuccessAlertProps> = ({ isVisible, onClose, message = 'Thanks for the submission! You are all set.' }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div className={s.alertContainer} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
          <div className={s.alert}>
            <div className={s.iconContainer}>
              <CheckCircleIcon />
            </div>
            <div className={s.messageContainer}>
              <p className={s.message}>{message}</p>
            </div>
            <button className={s.closeButton} onClick={onClose} aria-label="Close alert">
              <CloseIcon />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
