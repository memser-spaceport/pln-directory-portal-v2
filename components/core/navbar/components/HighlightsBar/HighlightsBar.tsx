import React, { PropsWithChildren } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import s from './HighlightsBar.module.scss';
import { clsx } from 'clsx';

const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

interface Props extends PropsWithChildren {
  variant: 'primary' | 'secondary';
}

export const HighlightsBar = ({ children, variant = 'primary' }: Props) => {
  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fade}
        transition={{ duration: 0.3 }}
        className={clsx(s.root, {
          [s.secondary]: variant === 'secondary',
        })}
      >
        <motion.div
          transition={{
            delay: 0.5,
            duration: 0.5,
          }}
          className={s.wrapper}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
