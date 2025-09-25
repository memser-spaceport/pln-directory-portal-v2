import React, { PropsWithChildren } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import s from './FloatingWidgets.module.scss';
import { clsx } from 'clsx';

interface Props extends PropsWithChildren {
  className?: string;
}

const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const FloatingWidgets = ({ children, className }: Props) => {
  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fade}
        transition={{ duration: 0.3, delay: 3.5 }}
        className={clsx(s.root, className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
