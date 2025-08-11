'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import s from './InvalidOfficeHoursLinkDialog.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
}

export const InvalidOfficeHoursLinkDialog = ({ isOpen, onClose, recipientName }: Props) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className={s.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} onClick={onClose}>
          <motion.div
            className={s.dialog}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={s.closeButton} onClick={onClose}>
              <CloseIcon />
            </button>

            <div className={s.content}>
              <motion.div className={s.iconWrapper} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}>
                <WarningIcon />
              </motion.div>

              <motion.h2 className={s.title} initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
                Office Hours Link Is Not Working
              </motion.h2>

              <motion.p className={s.description} initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.3 }}>
                Unfortunately, this member’s Office Hours link appears to be broken — so you can’t book a meeting right now.
              </motion.p>

              <motion.p className={s.description} initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}>
                <b>But don’t worry!</b>
              </motion.p>

              <motion.p className={s.description} initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.3 }}>
                We’ve just notified {recipientName} that you tried to connect. <br /> They’ll get an email letting them know their link needs an update.
              </motion.p>

              <motion.button className={s.continueButton} onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
                Got it
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.2887 14.962C16.4649 15.1381 16.5638 15.377 16.5638 15.626C16.5638 15.8751 16.4649 16.114 16.2887 16.2901C16.1126 16.4662 15.8737 16.5652 15.6247 16.5652C15.3756 16.5652 15.1367 16.4662 14.9606 16.2901L10.0005 11.3284L5.03874 16.2885C4.86261 16.4647 4.62374 16.5636 4.37467 16.5636C4.1256 16.5636 3.88673 16.4647 3.71061 16.2885C3.53449 16.1124 3.43555 15.8735 3.43555 15.6245C3.43555 15.3754 3.53449 15.1365 3.71061 14.9604L8.67233 10.0003L3.71217 5.03854C3.53605 4.86242 3.43711 4.62355 3.43711 4.37448C3.43711 4.12541 3.53605 3.88654 3.71217 3.71042C3.88829 3.53429 4.12716 3.43535 4.37624 3.43535C4.62531 3.43535 4.86418 3.53429 5.0403 3.71042L10.0005 8.67213L14.9622 3.70963C15.1383 3.53351 15.3772 3.43457 15.6262 3.43457C15.8753 3.43457 16.1142 3.53351 16.2903 3.70963C16.4664 3.88575 16.5654 4.12462 16.5654 4.3737C16.5654 4.62277 16.4664 4.86164 16.2903 5.03776L11.3286 10.0003L16.2887 14.962Z"
      fill="#455468"
    />
  </svg>
);

const WarningIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M29.6004 23.5113L18.6691 4.52758C18.396 4.06249 18.006 3.67686 17.5379 3.40891C17.0698 3.14096 16.5397 3 16.0004 3C15.461 3 14.931 3.14096 14.4629 3.40891C13.9947 3.67686 13.6048 4.06249 13.3316 4.52758L2.40036 23.5113C2.13753 23.9612 1.99902 24.4728 1.99902 24.9938C1.99902 25.5148 2.13753 26.0265 2.40036 26.4763C2.67003 26.9442 3.05933 27.332 3.52832 27.5997C3.9973 27.8675 4.52909 28.0057 5.06911 28.0001H26.9316C27.4712 28.0052 28.0025 27.8669 28.471 27.5991C28.9395 27.3314 29.3284 26.9439 29.5979 26.4763C29.8611 26.0267 30 25.5152 30.0005 24.9942C30.0009 24.4732 29.8628 23.9614 29.6004 23.5113ZM15.0004 13.0001C15.0004 12.7349 15.1057 12.4805 15.2933 12.293C15.4808 12.1054 15.7351 12.0001 16.0004 12.0001C16.2656 12.0001 16.5199 12.1054 16.7075 12.293C16.895 12.4805 17.0004 12.7349 17.0004 13.0001V18.0001C17.0004 18.2653 16.895 18.5197 16.7075 18.7072C16.5199 18.8947 16.2656 19.0001 16.0004 19.0001C15.7351 19.0001 15.4808 18.8947 15.2933 18.7072C15.1057 18.5197 15.0004 18.2653 15.0004 18.0001V13.0001ZM16.0004 24.0001C15.7037 24.0001 15.4137 23.9121 15.167 23.7473C14.9203 23.5825 14.7281 23.3482 14.6145 23.0741C14.501 22.8 14.4713 22.4984 14.5292 22.2074C14.5871 21.9165 14.7299 21.6492 14.9397 21.4394C15.1495 21.2296 15.4168 21.0868 15.7077 21.0289C15.9987 20.971 16.3003 21.0007 16.5744 21.1143C16.8485 21.2278 17.0827 21.4201 17.2476 21.6667C17.4124 21.9134 17.5004 22.2034 17.5004 22.5001C17.5004 22.8979 17.3423 23.2794 17.061 23.5607C16.7797 23.842 16.3982 24.0001 16.0004 24.0001Z"
      fill="#1B4DFF"
    />
  </svg>
);
