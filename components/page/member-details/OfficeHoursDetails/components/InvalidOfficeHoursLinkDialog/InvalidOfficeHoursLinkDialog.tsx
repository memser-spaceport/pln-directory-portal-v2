'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import s from './InvalidOfficeHoursLinkDialog.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientEmail: string;
  recipientTelegram: string;
}

export const InvalidOfficeHoursLinkDialog = ({ isOpen, onClose, recipientName, recipientEmail, recipientTelegram }: Props) => {
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
                Unable to Schedule Meeting
              </motion.h2>

              <motion.p className={s.description} initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.3 }}>
                This member&apos;s scheduling link is temporarily unavailable.
              </motion.p>

              <motion.p className={s.description} initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}>
                <b style={{ fontWeight: 500 }}>What happens next:</b>
              </motion.p>

              <motion.div className={s.practiceItem} initial={{ opacity: 0 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35, duration: 0.3 }}>
                <div className={s.practiceIcon}>
                  <CheckIcon />
                </div>
                <div className={s.practiceContent}>
                  <p className={s.practiceText}>{recipientName} will be notified immediately to fix their scheduling link</p>
                </div>
              </motion.div>

              <motion.div className={s.practiceItem} initial={{ opacity: 0 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.3 }}>
                <div className={s.practiceIcon}>
                  <CheckIcon />
                </div>
                <div className={s.practiceContent}>
                  <p className={s.practiceText}>We&apos;ll email you when their calendar is available for booking</p>
                </div>
              </motion.div>

              <motion.div className={s.practiceItem} initial={{ opacity: 0 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45, duration: 0.3 }}>
                <div className={s.practiceIcon}>
                  <CheckIcon />
                </div>
                <div className={s.practiceContent}>
                  <p className={s.practiceText}>This typically takes 24-48 hours</p>
                </div>
              </motion.div>

              {(recipientEmail || recipientTelegram) && (
                <motion.p className={s.description} initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.3 }}>
                  Need to meet sooner? Try contacting {recipientName} directly at {recipientEmail || recipientTelegram}.
                </motion.p>
              )}

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

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.1475 9.3525C16.2528 9.45797 16.312 9.60094 16.312 9.75C16.312 9.89906 16.2528 10.042 16.1475 10.1475L10.8975 15.3975C10.792 15.5028 10.6491 15.562 10.5 15.562C10.3509 15.562 10.208 15.5028 10.1025 15.3975L7.8525 13.1475C7.75314 13.0409 7.69905 12.8998 7.70162 12.7541C7.70419 12.6084 7.76323 12.4693 7.86629 12.3663C7.96935 12.2632 8.10839 12.2042 8.25411 12.2016C8.39984 12.199 8.54087 12.2531 8.6475 12.3525L10.5 14.2041L15.3525 9.3525C15.458 9.24716 15.6009 9.18799 15.75 9.18799C15.8991 9.18799 16.042 9.24716 16.1475 9.3525ZM21.5625 12C21.5625 13.8913 21.0017 15.7401 19.9509 17.3126C18.9002 18.8852 17.4067 20.1108 15.6594 20.8346C13.9121 21.5584 11.9894 21.7477 10.1345 21.3788C8.27951 21.0098 6.57564 20.099 5.2383 18.7617C3.90096 17.4244 2.99022 15.7205 2.62125 13.8656C2.25227 12.0106 2.44164 10.0879 3.16541 8.34059C3.88917 6.59327 5.11482 5.09981 6.68736 4.04907C8.25991 2.99833 10.1087 2.4375 12 2.4375C14.5352 2.44048 16.9658 3.44891 18.7584 5.24158C20.5511 7.03425 21.5595 9.46478 21.5625 12ZM20.4375 12C20.4375 10.3312 19.9427 8.69992 19.0155 7.31238C18.0884 5.92484 16.7706 4.84338 15.2289 4.20477C13.6871 3.56615 11.9906 3.39906 10.3539 3.72462C8.71722 4.05019 7.2138 4.85378 6.03379 6.03379C4.85379 7.21379 4.05019 8.71721 3.72463 10.3539C3.39907 11.9906 3.56616 13.6871 4.20477 15.2289C4.84338 16.7706 5.92484 18.0884 7.31238 19.0155C8.69992 19.9426 10.3312 20.4375 12 20.4375C14.237 20.435 16.3817 19.5453 17.9635 17.9635C19.5453 16.3817 20.435 14.237 20.4375 12Z"
      fill="#1B4DFF"
    />
  </svg>
);
