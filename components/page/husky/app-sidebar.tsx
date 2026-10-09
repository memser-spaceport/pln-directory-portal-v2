'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Sidebar, useSidebar } from './sidebar';
import { getHuskyHistory, deleteThread } from '@/services/husky.service';
import { getUserCredentials } from '@/utils/auth.utils';
import { triggerLoader } from '@/utils/common.utils';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ConfirmDialog } from '@/components/core/ConfirmDialog';
import { PAGE_ROUTES } from '@/utils/constants';
import { AI_SEARCH_HISTORY_PARAM } from '@/components/constants/aiSearchHandoff';
import { useLoginRedirect } from '@/components/core/login/utils';
import { OPEN_VISIT_CHAT_EVENT } from './constants/visitChats';
import { getVisitChats } from './utils/getVisitChats';
import { removeVisitChat } from './utils/removeVisitChat';
import { setPendingVisitChat } from './utils/setPendingVisitChat';
import { groupThreadsByDate } from './utils/groupThreadsByDate';
import type { IHistoryThread } from './types/historyThread';
import { HistorySearch } from './HistorySearch';

type DeleteTarget = Pick<IHistoryThread, 'threadId' | 'title'>;

interface ThreadItemProps {
  thread: IHistoryThread;
  isActive: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  handleDeleteModalOpen: (thread: IHistoryThread) => void;
  onOpen?: (thread: IHistoryThread) => void;
}

// Extracted ThreadItem component and memoized it to prevent unnecessary re-renders
const ThreadItem = ({ thread, isActive, isMobile, toggleSidebar, handleDeleteModalOpen, onOpen }: ThreadItemProps) => {
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
    (e: React.MouseEvent) => {
      e.stopPropagation();
      analytics.trackDeleteThread(thread.threadId, thread.title);
      handleDeleteModalOpen(thread);
    },
    [thread, handleDeleteModalOpen, analytics],
  );

  return (
    <li
      key={thread.threadId}
      data-active={isActive}
      className="sidebar__body__history__list__ul__li"
      onClick={handleClick}
    >
      <span className="sidebar__body__history__list__ul__li__text">{thread.title}</span>
      <div className="sidebar__body__history__list__ul__li__actions">
        <button onClick={handleDeleteClick} className="sidebar__body__history__list__ul__li__actions__button">
          <img width={20} height={20} src="/icons/delete-icon.svg" alt="delete" />
        </button>
      </div>
      <style jsx>{`
        .sidebar__body__history__list__ul__li {
          list-style: none;
          color: #455468;
          font-weight: 400;
          font-size: 14px;
          line-height: 22px;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 100%;
          gap: 10px;
        }

        .sidebar__body__history__list__ul__li__text {
          max-width: 100%;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar__body__history__list__ul__li__actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .sidebar__body__history__list__ul__li:hover .sidebar__body__history__list__ul__li__actions,
        .sidebar__body__history__list__ul__li[data-active='true'] .sidebar__body__history__list__ul__li__actions {
          opacity: 1;
        }

        .sidebar__body__history__list__ul__li:hover {
          background-color: rgba(14, 15, 17, 0.04);
        }

        /* the open chat outranks the hovered one: a darker wash and the primary text colour */
        .sidebar__body__history__list__ul__li[data-active='true'] {
          background-color: rgba(14, 15, 17, 0.06);
          color: #0a0c11;
        }

        .sidebar__body__history__list__ul__li__actions__button {
          display: flex;
        }

        button {
          background-color: transparent;
        }

        .sidebar__body__history__list__ul__li__actions {
          display: none;
        }

        @media (min-width: 768px) {
          .sidebar__body__history__list__ul__li__actions {
            display: flex;
          }
        }
      `}</style>
    </li>
  );
};

const AppSidebar = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const { toggleSidebar, setOpen, setOpenMobile, state, isMobile } = useSidebar();
  const searchParams = useSearchParams();
  const [history, setHistory] = useState<IHistoryThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const analytics = useHuskyAnalytics();
  const { id } = useParams();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isMac, setIsMac] = useState(false);
  const [query, setQuery] = useState('');
  // A chat open on /ai-search has no id in the URL; the chat announces it through refresh-husky-history.
  const [announcedChatId, setAnnouncedChatId] = useState<string | null>(null);
  const goToLogin = useLoginRedirect();
  const openChatId = (id as string | undefined) ?? announcedChatId;

  const fetchHistory = async (showLoading = true) => {
    if (!isLoggedIn) {
      setHistory(getVisitChats());
      setIsLoading(false);
      return;
    }
    try {
      if (showLoading) {
        setIsLoading(true);
      }

      const { authToken } = await getUserCredentials(isLoggedIn);
      const res = await getHuskyHistory(authToken);

      if (res.isError) {
        setHistory([]);
      } else {
        setHistory(res);
      }
    } catch (error) {
      console.error('Error fetching history', error);
      setHistory([]);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleSidebarToggle = useCallback(() => {
    toggleSidebar();
    analytics.trackSidebarToggleClicked();
  }, [toggleSidebar, analytics]);

  const handleNewConversation = useCallback(() => {
    if (isMobile) {
      handleSidebarToggle();
    }
    router.push(PAGE_ROUTES.HUSKY);
    document.dispatchEvent(new CustomEvent('new-chat'));
    analytics.trackSidebarNewConversationClicked();
  }, [isMobile, handleSidebarToggle, router, analytics]);

  const handleOpenVisitChat = useCallback(
    (thread: IHistoryThread) => {
      setAnnouncedChatId(thread.threadId);
      // The /ai-search page opens it on mount, or at once through the event when it is already open.
      setPendingVisitChat(thread.threadId);
      document.dispatchEvent(new Event(OPEN_VISIT_CHAT_EVENT));
      router.push(PAGE_ROUTES.HUSKY);
    },
    [router],
  );

  const handleSignUp = useCallback(() => {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    router.push(`${PAGE_ROUTES.SIGNUP}?returnTo=${returnTo}`);
  }, [router]);

  const handleOpenSidebar = useCallback(() => {
    if (state === 'collapsed') {
      handleSidebarToggle();
    }
  }, [state, handleSidebarToggle]);

  const handleDeleteModalOpen = useCallback((thread: IHistoryThread) => {
    setDeleteTarget({ threadId: thread.threadId, title: thread.title });
  }, []);

  const handleDeleteModalClose = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const leaveDeletedChat = (deletedId: string) => {
    if (deletedId !== openChatId) {
      return;
    }
    setAnnouncedChatId(null);
    document.dispatchEvent(new CustomEvent('new-chat'));
    router.push(PAGE_ROUTES.HUSKY);
  };

  const handleDeleteThread = async () => {
    if (!deleteTarget) {
      return;
    }
    const deleteId = deleteTarget.threadId;
    const toast = (await import('react-toastify')).toast;
    analytics.trackThreadDeleteConfirmationStatus(deleteId, 'initiated');
    if (!isLoggedIn) {
      handleDeleteModalClose();
      removeVisitChat(deleteId);
      setHistory(getVisitChats());
      analytics.trackThreadDeleteConfirmationStatus(deleteId, 'success');
      leaveDeletedChat(deleteId);
      return;
    }
    triggerLoader(true);
    const { authToken } = await getUserCredentials(isLoggedIn);
    handleDeleteModalClose();
    // Create a loading toast
    const toastId = toast.loading('Deleting thread...');

    try {
      // Delete the thread
      const res = await deleteThread(authToken, deleteId);

      if (!res) {
        toast.update(toastId, {
          render: 'Failed to delete thread. Please try again.',
          type: 'error',
          isLoading: false,
          autoClose: 3000,
        });
        analytics.trackThreadDeleteConfirmationStatus(deleteId, 'failed');
        return;
      }
      // Refresh history
      await fetchHistory(false);

      // Update toast to success
      toast.update(toastId, {
        render: 'Thread deleted successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      analytics.trackThreadDeleteConfirmationStatus(deleteId, 'success');
      leaveDeletedChat(deleteId);
    } catch (error) {
      console.error('Error deleting thread:', error);
      analytics.trackThreadDeleteConfirmationStatus(deleteId, 'failed');
      // Update toast to error
      toast.update(toastId, {
        render: 'Failed to delete thread. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      triggerLoader(false);
    }
  };

  const shownHistory = useMemo(() => {
    const words = query.trim().toLowerCase();
    return words ? history.filter((thread) => thread.title?.toLowerCase().includes(words)) : history;
  }, [history, query]);

  const historyGroups = useMemo(() => groupThreadsByDate(shownHistory), [shownHistory]);
  const deleteSubject = deleteTarget?.title ? `“${deleteTarget.title}”` : 'This chat';

  // "All chats" in the header search opens the page with History showing: the rail, or the drawer below 960px.
  useEffect(() => {
    if (searchParams.get(AI_SEARCH_HISTORY_PARAM) !== 'open') {
      return;
    }
    if (window.innerWidth < 960) {
      setOpenMobile(true);
    } else {
      setOpen(true);
    }
    router.replace(window.location.pathname, { scroll: false });
  }, [searchParams, setOpen, setOpenMobile, router]);

  useEffect(() => {
    fetchHistory(true); // Show loading on initial fetch

    const handleRefreshHistory = (e: Event) => {
      const openThreadId = (e as CustomEvent<{ openThreadId?: string }>).detail?.openThreadId;
      if (openThreadId) {
        setAnnouncedChatId(openThreadId);
      }
      fetchHistory(false); // Don't show loading when called via event listener
    };

    const handleDeleteThread = (e: CustomEvent<DeleteTarget>) => {
      setDeleteTarget(e.detail);
    };

    // Detect if the user is on macOS
    const detectMac = () => {
      setIsMac(/Mac/i.test(navigator.userAgent));
    };

    detectMac();

    const handleNewChat = () => setAnnouncedChatId(null);

    document.addEventListener('refresh-husky-history', handleRefreshHistory as EventListener);
    document.addEventListener('delete-thread', handleDeleteThread as EventListener);
    document.addEventListener('new-chat', handleNewChat);

    return () => {
      document.removeEventListener('refresh-husky-history', handleRefreshHistory as EventListener);
      document.removeEventListener('delete-thread', handleDeleteThread as EventListener);
      document.removeEventListener('new-chat', handleNewChat);
    };
  }, []);

  return (
    <>
      <Sidebar>
        <div data-state={state} className="sidebar__header">
          <div className="sidebar__header__logo-container">
            <button className="sidebar__header__logo-icon-button" onClick={handleSidebarToggle}>
              <img src="/icons/sidenav-close.svg" alt="toggle sidebar" />
            </button>
          </div>
          <button onClick={handleNewConversation} className="sidebar__header__newConversation">
            <img src="/icons/add.svg" alt="plus" />
            <span className="sidebar__header__newConversation__text">New chat</span>
          </button>
        </div>
        <div data-state={state} className="sidebar__body">
          <div className="sidebar__body__history">
            <div className="sidebar__body__search">
              <HistorySearch value={query} onChange={setQuery} />
            </div>
            <div onClick={handleOpenSidebar} className="sidebar__body__history__header">
              <div className="sidebar__body__history__header__title">
                <img width={22} height={22} src="/icons/history.svg" alt="history" />
                <span className="sidebar__body__history__header__title__text">
                  {isLoggedIn ? 'History' : 'This visit'}
                </span>
              </div>
            </div>
            <div className="sidebar__body__history__list">
              {isLoading ? (
                <SkeletonLoader />
              ) : history.length === 0 ? (
                <div className="sidebar__body__history__list__empty">
                  {isLoggedIn
                    ? 'Your conversations will appear here once you start chatting!'
                    : 'Chats you start appear here.'}
                </div>
              ) : shownHistory.length === 0 ? (
                <div className="sidebar__body__history__list__empty">No chats match &ldquo;{query.trim()}&rdquo;.</div>
              ) : !isLoggedIn ? (
                <ul className="sidebar__body__history__list__ul">
                  {shownHistory.map((chat) => (
                    <ThreadItem
                      isActive={chat.threadId === openChatId}
                      key={chat.threadId}
                      thread={chat}
                      isMobile={isMobile}
                      toggleSidebar={handleSidebarToggle}
                      handleDeleteModalOpen={handleDeleteModalOpen}
                      onOpen={id === chat.threadId ? undefined : handleOpenVisitChat}
                    />
                  ))}
                </ul>
              ) : (
                historyGroups.map(([label, threads]) => (
                  <div key={label} className="sidebar__body__history__group">
                    <div className="sidebar__body__history__group__label">{label}</div>
                    <ul className="sidebar__body__history__list__ul">
                      {threads.map((chat) => (
                        <ThreadItem
                          isActive={chat.threadId === openChatId}
                          key={chat.threadId}
                          thread={chat}
                          isMobile={isMobile}
                          toggleSidebar={handleSidebarToggle}
                          handleDeleteModalOpen={handleDeleteModalOpen}
                        />
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
            {!isLoggedIn && (
              <div className="sidebar__body__keep">
                <p className="sidebar__body__keep__title">Sign in to keep your chats</p>
                <p className="sidebar__body__keep__text">
                  Chats you start signed out are gone when you leave. Signed in, every chat is kept here with its own
                  link.
                </p>
                <div className="sidebar__body__keep__actions">
                  <button type="button" onClick={handleSignUp} className="sidebar__body__keep__signup">
                    Sign up
                  </button>
                  <button type="button" onClick={() => goToLogin()} className="sidebar__body__keep__signin">
                    Sign in
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div data-state={state} className="sidebar__footer">
          <div className="sidebar__footer__shortcut">
            <div className="sidebar__footer__shortcut__key">{isMac ? '⌘' : 'Ctrl'}</div>
            <span className="sidebar__footer__shortcut__plus">+</span>
            <div className="sidebar__footer__shortcut__key">B</div>
            <span className="sidebar__footer__shortcut__text">to expand/collapse</span>
          </div>
          <button className="sidebar__footer__toggleSidebar" onClick={handleSidebarToggle}>
            <img src="/icons/sidenav-close.svg" alt="toggle sidebar" />
          </button>
        </div>
      </Sidebar>
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete chat?"
        desc={
          isLoggedIn
            ? `${deleteSubject} will be removed from your history, and its link will stop working.`
            : `${deleteSubject} will be removed from this visit's chats.`
        }
        confirmTitle="Delete"
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteThread}
      />
      <style jsx>{`
        .sidebar__header {
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
        }

        .sidebar__header__logo-container {
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 12px;
        }

        .sidebar__header__newConversation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 14px 0px;
          border-top: 1px solid #0000001a;
          border-bottom: 1px solid #0000001a;
        }

        .sidebar__header__newConversation:hover {
          background-color: #f1f5f9;
        }

        .sidebar__body[data-state='collapsed'] .sidebar__body__history__header:hover {
          background-color: #f1f5f9;
          cursor: pointer;
        }

        .sidebar__header__newConversation__text {
          font-weight: 500;
          font-size: 13px;
          line-height: 14px;
          color: #156ff7;
        }

        .sidebar__body {
          flex: 1;
          padding: 0px 8px 10px 18px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sidebar__body__keep {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 12px 10px 0 0;
          padding: 12px;
          border: 1px solid rgba(27, 56, 96, 0.12);
          border-radius: 8px;
          background-color: #ffffff;
        }

        .sidebar__body[data-state='collapsed'] .sidebar__body__keep {
          display: none;
        }

        .sidebar__body__keep__title {
          margin: 0;
          color: #0a0c11;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
        }

        .sidebar__body__keep__text {
          margin: 0;
          color: #455468;
          font-size: 12px;
          line-height: 16px;
        }

        .sidebar__body__keep__actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .sidebar__body__keep__signup,
        .sidebar__body__keep__signin {
          flex: 1;
          height: 32px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          line-height: 20px;
          cursor: pointer;
        }

        .sidebar__body__keep__signup {
          border: 1px solid #cbd5e1;
          background-color: #ffffff;
          color: #0f172a;
        }

        .sidebar__body__keep__signin {
          border: none;
          background-color: #156ff7;
          color: #ffffff;
        }

        .sidebar__body__keep__signin:hover {
          background-color: #1d4ed8;
        }

        .sidebar__body__history__list__empty {
          display: flex;
          justify-content: center;
          height: 100%;
          color: #64748b;
          font-size: 14px;
          line-height: 22px;
        }

        .sidebar__body__history {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .sidebar__body__history__list {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 10px 10px 0px 0px;
        }

        .sidebar__body__history__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sidebar__body__history__header__title {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .sidebar__body__history__header__title__text {
          font-weight: 500;
          font-size: 14px;
          line-height: 22px;
          color: #000000;
        }

        .sidebar__body__history__list__ul {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar__body__search {
          padding-right: 10px;
        }

        .sidebar__body__history__group + .sidebar__body__history__group {
          margin-top: 16px;
        }

        .sidebar__body__history__group__label {
          padding: 0 8px 4px;
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
          line-height: 16px;
        }

        .sidebar__body__history__list__ul__li {
          list-style: none;
          color: #64748b;
          font-weight: 400;
          font-size: 14px;
          line-height: 22px;
          padding: 4px 8px 4px 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar__body__history__list__ul__li:hover {
          background-color: #f1f5f9;
          border-radius: 4px;
        }

        .sidebar__footer {
          display: none;
          height: 64px;
          align-items: center;
          justify-content: space-between;
          border-top: 0.5px solid #cbd5e1;
          padding: 0 20px 0 20px;
        }

        .sidebar__footer__shortcut {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .sidebar__footer__shortcut__key {
          border: 0.5px solid #cbd5e1;
          border-radius: 3px;
          padding: 0 4px;
          font-size: 10px;
          font-weight: 400;
          line-height: 20px;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar__footer__shortcut__key:first-of-type {
          line-height: 16px;
          height: 16px;
          padding: 0 4px;
        }

        .sidebar__footer__shortcut__key:last-of-type {
          width: 16px;
          height: 16px;
          padding: 0;
        }

        .sidebar__footer__shortcut__text {
          font-size: 10px;
          color: #64748b;
          font-weight: 400;
          line-height: 20px;
        }

        .sidebar__footer__shortcut__plus {
          font-size: 10px;
          color: #64748b;
          font-weight: 400;
          line-height: 20px;
        }

        button {
          background-color: transparent;
        }

        .container {
          display: flex;
          flex-direction: column;
        }

        .sidebar__footer__toggleSidebar {
          display: flex;
          align-items: center;
          padding: 8px;
        }

        .sidebar__footer__toggleSidebar:hover {
          background-color: #f1f5f9;
          border-radius: 4px;
        }

        @media (min-width: 960px) {
          .sidebar__body[data-state='collapsed'] .sidebar__body__search {
            display: none;
          }

          .sidebar__header[data-state='collapsed'] {
            padding: unset;
          }

          .sidebar__header[data-state='collapsed'] .sidebar__header__newConversation {
            padding: 23px;
          }

          .sidebar__header[data-state='collapsed'] .sidebar__header__newConversation__text {
            display: none;
          }

          .sidebar__body[data-state='collapsed'] {
            padding: unset;
          }

          .sidebar__body[data-state='collapsed'] .sidebar__body__history__header {
            justify-content: center;
            height: 60px;
            border-bottom: 0.5px solid #cbd5e1;
          }

          .sidebar__body[data-state='collapsed'] .sidebar__body__history__header__title__text,
          .sidebar__body[data-state='collapsed'] .sidebar__body__history__header__actions {
            display: none;
          }

          .sidebar__footer[data-state='collapsed'] {
            justify-content: center;
            padding: 0;
          }

          .sidebar__footer[data-state='collapsed'] .sidebar__footer__shortcut {
            display: none;
          }

          .sidebar__footer[data-state='collapsed'] .sidebar__footer__toggleSidebar {
            transform: scaleX(-1);
          }

          .sidebar__body[data-state='collapsed'] .sidebar__body__history__list {
            display: none;
          }

          .sidebar__footer {
            display: flex;
          }

          .sidebar__header__logo-container {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

// Extracted SkeletonLoader component
const SkeletonLoader = () => (
  <>
    {[68, 54, 28, 64, 52].map((width) => (
      <div key={width} className="skeleton-wrapper">
        <div className="skeleton" style={{ width: `${width}%` }} />
      </div>
    ))}
    <style jsx>{`
      .skeleton-wrapper {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0 0.5rem;
        height: 2rem;
        border-radius: 0.375rem;
      }
      .skeleton {
        height: 1rem;
        border-radius: 0.375rem;
        background-color: rgba(0, 0, 0, 0.1);
      }
    `}</style>
  </>
);

export default AppSidebar;
