import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';

import s from './CollapsableSection.module.scss';
import Image from 'next/image';

export const CollapsibleSection = ({ title, children, disabled, initialOpen = false }: { title: string; children: React.ReactNode; disabled?: boolean; initialOpen: boolean }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className={s.root}>
      <button onClick={() => setIsOpen((prev) => !prev)} className={s.button} disabled={disabled}>
        {title}
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <Image src="/icons/down-arrow-grey.svg" alt="Toggle" width={14} height={14} style={{ pointerEvents: 'none' }} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { height: 'auto', opacity: 1 },
              collapsed: { height: 0, opacity: 0 },
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
