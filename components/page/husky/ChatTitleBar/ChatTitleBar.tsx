'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { Menu } from '@base-ui-components/react/menu';

import { PAGE_ROUTES } from '@/utils/constants';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';

import { TrashIcon } from '@/components/icons';

import { useSidebar } from '../sidebar';

import s from './ChatTitleBar.module.scss';

interface ShownChat {
  threadId?: string;
  title: string;
  sharedBy?: { name?: string; image?: string };
}

interface Props {
  chat?: ShownChat;
}

export const ChatTitleBar = (props: Props) => {
  const { chat } = props;

  const router = useRouter();
  const { state, toggleSidebar } = useSidebar();
  const analytics = useHuskyAnalytics();

  // Someone else's shared chat is read here; Delete belongs to the copy a follow-up makes.
  const ownThreadId = chat && !chat.sharedBy ? chat.threadId : undefined;

  const openHistory = () => {
    toggleSidebar();
    analytics.trackMobileHeaderToggleClicked();
  };

  const startNewChat = () => {
    router.push(PAGE_ROUTES.HUSKY);
    document.dispatchEvent(new CustomEvent('new-chat'));
  };

  const askToDelete = (threadId: string, title: string) => {
    analytics.trackDeleteThread(threadId, title);
    document.dispatchEvent(new CustomEvent('delete-thread', { detail: { threadId, title } }));
  };

  return (
    <div className={clsx(s.root, chat ? s.pinned : s.bare)} data-state={state}>
      <button type="button" className={clsx(s.button, s.belowRail)} onClick={openHistory}>
        <img src="/icons/history.svg" alt="" width={18} height={18} />
        History
      </button>

      {chat && (
        <>
          <div className={s.titleBlock}>
            <h1 className={s.title} title={chat.title}>
              {chat.title}
            </h1>
            {chat.sharedBy?.name && (
              <span className={s.sharedBy}>
                <img
                  className={s.sharedAvatar}
                  src={chat.sharedBy.image || '/icons/default_profile.svg'}
                  alt=""
                  width={16}
                  height={16}
                />
                <span className={s.sharedName}>Shared by {chat.sharedBy.name}</span>
                <span className={s.sharedHint}>· Ask a follow-up to make your own copy</span>
              </span>
            )}
          </div>

          <div className={s.actions}>
            {ownThreadId && (
              <>
                <Menu.Root modal={false}>
                  <Menu.Trigger className={s.menuTrigger} aria-label="More actions for this chat">
                    <img src="/icons/menu-dots.svg" alt="" width={16} height={16} />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner className={s.positioner} side="bottom" align="end" sideOffset={6}>
                      <Menu.Popup className={s.popup}>
                        <Menu.Item
                          className={clsx(s.item, s.danger)}
                          onClick={() => askToDelete(ownThreadId, chat.title)}
                        >
                          <TrashIcon />
                          Delete
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </>
            )}
            <button type="button" className={clsx(s.newChat, s.belowRail)} onClick={startNewChat} aria-label="New chat">
              <img src="/icons/add.svg" alt="" width={16} height={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
