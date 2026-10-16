import { useRouter } from 'next/navigation';
import { useCallback, MouseEvent } from 'react';

import { PAGE_ROUTES } from '@/utils/constants';

import { triggerLoader } from '@/utils/common.utils';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';

import type { IHistoryThread } from '../../types/historyThread';

import s from './ThreadItem.module.scss';

interface Props {
  thread: IHistoryThread;
  isActive: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  handleDeleteModalOpen: (thread: IHistoryThread) => void;
  onOpen?: (thread: IHistoryThread) => void;
}

export const ThreadItem = (props: Props) => {
  const { thread, isActive, isMobile, toggleSidebar, handleDeleteModalOpen, onOpen } = props;

  const analytics = useHuskyAnalytics();
  const router = useRouter();

  const handleClick = useCallback(() => {
    // A visit chat has no URL of its own, so it opens even when the rail still marks it as open.
    if (onOpen || !isActive) {
      if (onOpen) {
        onOpen(thread);
      } else {
        triggerLoader(true);
        router.push(`${PAGE_ROUTES.HUSKY}/${thread.threadId}`);
      }
      if (isMobile) {
        toggleSidebar();
      }
      analytics.trackHistoryListItemClicked({ threadId: thread.threadId, title: thread.title });
    }
  }, [isActive, thread, router, isMobile, toggleSidebar, analytics, onOpen]);

  const handleDeleteClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      analytics.trackDeleteThread(thread.threadId, thread.title);
      handleDeleteModalOpen(thread);
    },
    [thread, handleDeleteModalOpen, analytics],
  );

  return (
    <li data-active={isActive} className={s.root} onClick={handleClick}>
      <span className={s.text} title={thread.title}>
        {thread.title}
      </span>
      <div className={s.actions}>
        <button onClick={handleDeleteClick} className={s.deleteButton}>
          <img width={20} height={20} src="/icons/delete-icon.svg" alt="delete" />
        </button>
      </div>
    </li>
  );
};
