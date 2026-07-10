'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { useAiApps } from '@/services/ai-apps/hooks/useAiApps';

import { AddAiAppCard } from '../AddAiAppCard';

import { getAddCardVariants, getCardVariants, getContainerVariants } from './AiAppsGrid.variants';
import { AiAppCard } from './components/AiAppCard';

import s from './AiAppsGrid.module.scss';

interface Props {
  onOpenCreateModal: () => void;
}

export function AiAppsGrid({ onOpenCreateModal }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const { apps, isLoading, isError } = useAiApps();

  if (isLoading) {
    return <div className={s.state}>Loading apps…</div>;
  }

  if (isError) {
    return <div className={s.state}>Unable to load apps. Please try again later.</div>;
  }

  const containerVariants = getContainerVariants(!!shouldReduceMotion);
  const addCardVariants = getAddCardVariants();
  const cardVariants = getCardVariants(!!shouldReduceMotion);

  return (
    <motion.div className={s.grid} variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={addCardVariants}>
        <AddAiAppCard onClick={onOpenCreateModal} />
      </motion.div>
      {apps.map((app) => (
        <motion.div key={app.uid} variants={cardVariants}>
          <AiAppCard app={app} />
        </motion.div>
      ))}
    </motion.div>
  );
}
