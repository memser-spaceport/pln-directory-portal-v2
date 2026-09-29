import { clsx } from 'clsx';
import { motion } from 'framer-motion';

import type { FeedbackTab } from '../../types';

import s from './FeedbackTabs.module.scss';

interface Props {
  readonly tabs: FeedbackTab[];
  readonly activeTab: string;
  readonly onTabClick: (tab: string) => void;
}

export function FeedbackTabs({ tabs, activeTab, onTabClick }: Props) {
  return (
    <div className={s.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab.name}
          type="button"
          className={clsx(s.tab, { [s.tabActive]: tab.name === activeTab })}
          onClick={() => onTabClick(tab.name)}
        >
          {tab.name}
          <span className={s.tabCount}>{tab.count}</span>
          {tab.name === activeTab && (
            <motion.span
              layoutId="aiAppFeedbackActiveTab"
              className={s.activeIndicator}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
