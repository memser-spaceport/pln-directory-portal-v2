'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Sidebar, useSidebar } from './sidebar';
import { getYear, isYesterday, isToday, subMonths, subWeeks } from 'date-fns';
import { getHuskyHistory, deleteThread } from '@/services/husky.service';
import { getUserCredentials } from '@/utils/auth.utils';
import { triggerLoader } from '@/utils/common.utils';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { useParams, useRouter } from 'next/navigation';
import Modal from '@/components/core/modal';
import { PAGE_ROUTES } from '@/utils/constants';
import { useLoginRedirect } from '@/components/core/login/utils';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';
import { OPEN_VISIT_CHAT_EVENT, getVisitChats, removeVisitChat, setPendingVisitChat } from '@/utils/husky-visit-chats';

interface IThread {
  title: string;
  threadId: string;
  createdAt: string;
  updatedAt: string;
}

interface ThreadItemProps {
  thread: IThread;
  isActive: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  handleDeleteModalOpen: (thread: IThread) => void;
  onOpen?: (thread: IThread) => void;
}

// Extracted ThreadItem component and memoized it to prevent unnecessary re-renders
const ThreadItem = ({ thread, isActive, isMobile, toggleSidebar, handleDeleteModalOpen, onOpen }: ThreadItemProps) => {
  const analytics = useHuskyAnalytics();
  const router = useRouter();

  const handleClick = useCallback(() => {
    // a visit chat has no URL of its own, so it opens even when the rail still marks it as open
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
          color: #64748b;
          font-weight: 400;
          font-size: 14px;
          line-height: 22px;
          padding: 4px 8px;
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
          background-color: #f1f5f9;
          border-radius: 4px;
        }

        .sidebar__body__history__list__ul__li[data-active='true'] {
          background-color: #f1f5f9;
          border-radius: 4px;
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
  const { toggleSidebar, state, isMobile } = useSidebar();
  const [history, setHistory] = useState<IThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const analytics = useHuskyAnalytics();
  const { id } = useParams();
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteModalRef = useRef<HTMLDialogElement>(null);
  const [isMac, setIsMac] = useState(false);
  // signed out: the chat from this visit that is open on /ai-search (it has no URL of its own)
  const [activeVisitChatId, setActiveVisitChatId] = useState<string | null>(null);
  const goToLogin = useLoginRedirect();
  const unifiedSearchAnalytics = useUnifiedSearchAnalytics();

  const fetchHistory = async (showLoading = true) => {
    if (!isLoggedIn) {
      // signed out, chats are not saved on the server: list this visit's chats
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
    (thread: IThread) => {
      setActiveVisitChatId(thread.threadId);
      // the /ai-search page opens it when it mounts, or at once through the event if it is already open
      setPendingVisitChat(thread.threadId);
      document.dispatchEvent(new CustomEvent(OPEN_VISIT_CHAT_EVENT, { detail: { threadId: thread.threadId } }));
      router.push(PAGE_ROUTES.HUSKY);
    },
    [router],
  );

  const handleSignIn = useCallback(() => {
    unifiedSearchAnalytics.onSigninPromptClicked('sign-in');
    goToLogin();
  }, [goToLogin, unifiedSearchAnalytics]);

  const handleSignUp = useCallback(() => {
    unifiedSearchAnalytics.onSigninPromptClicked('sign-up');
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    router.push(`${PAGE_ROUTES.SIGNUP}?returnTo=${returnTo}`);
  }, [router, unifiedSearchAnalytics]);

  const handleOpenSidebar = useCallback(() => {
    if (state === 'collapsed') {
      handleSidebarToggle();
    }
  }, [state, handleSidebarToggle]);

  const handleDeleteModalOpen = useCallback((thread: IThread) => {
    if (deleteModalRef.current) {
      deleteModalRef.current.showModal();
    }
    setIsDeleteModalOpen(true);
    setDeleteId(thread.threadId);
  }, []);

  const handleDeleteModalClose = useCallback(() => {
    if (deleteModalRef.current) {
      deleteModalRef.current.close();
    }
    setIsDeleteModalOpen(false);
  }, []);

  const handleDeleteThread = useCallback(async () => {
    if (!deleteId) return;
    const toast = (await import('react-toastify')).toast;
    analytics.trackThreadDeleteConfirmationStatus(deleteId, 'initiated');
    if (!isLoggedIn) {
      handleDeleteModalClose();
      removeVisitChat(deleteId);
      setHistory(getVisitChats());
      analytics.trackThreadDeleteConfirmationStatus(deleteId, 'success');
      if (deleteId === activeVisitChatId) {
        setActiveVisitChatId(null);
        document.dispatchEvent(new CustomEvent('new-chat'));
      }
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
      // Redirect to home if the deleted thread is the current one
      document.dispatchEvent(new CustomEvent('new-chat'));
      if (deleteId === id) {
        router.push(PAGE_ROUTES.HUSKY);
      }
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
  }, [deleteId, id, router, fetchHistory, handleDeleteModalClose, isLoggedIn, activeVisitChatId]);

  const groupChatsByDate = useCallback((chats: IThread[]) => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);
    const currentYear = getYear(now);

    return chats.reduce(
      (
        groups: {
          today: IThread[];
          yesterday: IThread[];
          lastWeek: IThread[];
          lastMonth: IThread[];
          [year: number]: IThread[];
        },
        chat: IThread,
      ) => {
        const chatDate = new Date(chat.createdAt);
        const chatYear = getYear(chatDate);

        if (isNaN(chatDate.getTime())) return groups;

        if (isToday(chatDate)) {
          groups.today.push(chat);
        } else if (isYesterday(chatDate)) {
          groups.yesterday.push(chat);
        } else if (chatDate > oneWeekAgo) {
          groups.lastWeek.push(chat);
        } else if (chatDate > oneMonthAgo) {
          groups.lastMonth.push(chat);
        } else if (chatYear < currentYear) {
          if (!groups[chatYear]) groups[chatYear] = [];
          groups[chatYear].push(chat);
        }

        return groups;
      },
      {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
      },
    );
  }, []);

  // Memoize the grouped chats to prevent unnecessary recalculations
  const groupedChats = useMemo(() => groupChatsByDate(history), [history, groupChatsByDate]);

  // Memoize the ordered keys for better performance
  const orderedKeys = useMemo(() => {
    const fixedKeys = ['today', 'yesterday', 'lastWeek', 'lastMonth'];

    // Get dynamically generated year sections and sort in descending order
    const yearKeys = Object.keys(groupedChats)
      .filter((key) => !fixedKeys.includes(key))
      .sort((a, b) => Number(b) - Number(a));

    return [...fixedKeys, ...yearKeys];
  }, [groupedChats]);

  useEffect(() => {
    fetchHistory(true); // Show loading on initial fetch

    const handleRefreshHistory = (e: Event) => {
      const visitThreadId = (e as CustomEvent<{ visitThreadId?: string }>).detail?.visitThreadId;
      if (visitThreadId) {
        setActiveVisitChatId(visitThreadId);
      }
      fetchHistory(false); // Don't show loading when called via event listener
    };

    const handleDeleteThread = (e: CustomEvent<{ threadId: string }>) => {
      const { threadId } = e.detail;
      setDeleteId(threadId);
      setIsDeleteModalOpen(true);
      if (deleteModalRef.current) {
        deleteModalRef.current.showModal();
      }
    };

    // Detect if the user is on macOS
    const detectMac = () => {
      setIsMac(/Mac/i.test(navigator.userAgent));
    };

    detectMac();

    const handleNewChat = () => setActiveVisitChatId(null);

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
              ) : !isLoggedIn ? (
                history.length === 0 ? (
                  <div className="sidebar__body__history__list__empty">Chats you start appear here.</div>
                ) : (
                  <ul className="sidebar__body__history__list__ul">
                    {history.map((chat: IThread) => (
                      <ThreadItem
                        isActive={chat.threadId === (id ?? activeVisitChatId)}
                        key={chat.threadId}
                        thread={chat}
                        isMobile={isMobile}
                        toggleSidebar={handleSidebarToggle}
                        handleDeleteModalOpen={handleDeleteModalOpen}
                        onOpen={id === chat.threadId ? undefined : handleOpenVisitChat}
                      />
                    ))}
                  </ul>
                )
              ) : history.length === 0 ? (
                <div className="sidebar__body__history__list__empty">
                  Your conversations will appear here once you start chatting!
                </div>
              ) : (
                <ul className="sidebar__body__history__list__ul">
                  {orderedKeys.map((key) =>
                    groupedChats[key as keyof typeof groupedChats]?.length > 0 ? (
                      <React.Fragment key={key}>
                        <div className="sidebar__body__history__list__ul__title">
                          {key === 'lastWeek'
                            ? 'Last 7 days'
                            : key === 'lastMonth'
                              ? 'Last 30 days'
                              : key === 'today'
                                ? 'Today'
                                : key === 'yesterday'
                                  ? 'Yesterday'
                                  : key}
                        </div>
                        {groupedChats[key as keyof typeof groupedChats]
                          .sort(
                            (a: IThread, b: IThread) =>
                              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                          ) // Sort by createdAt (newest first)
                          .map((chat: IThread) => (
                            <ThreadItem
                              isActive={chat.threadId === id}
                              key={chat.threadId}
                              thread={chat}
                              isMobile={isMobile}
                              toggleSidebar={handleSidebarToggle}
                              handleDeleteModalOpen={handleDeleteModalOpen}
                            />
                          ))}
                      </React.Fragment>
                    ) : null,
                  )}
                </ul>
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
                  <button type="button" onClick={handleSignIn} className="sidebar__body__keep__signin">
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
      <Modal modalRef={deleteModalRef} onClose={handleDeleteModalClose}>
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleDeleteModalClose}
          onDelete={handleDeleteThread}
          modalRef={deleteModalRef}
        />
      </Modal>
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

        .sidebar__body__history__list__ul__title {
          font-weight: 500;
          font-size: 14px;
          line-height: 22px;
          color: #000000;
          padding: 8px 0px 8px 8px;
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

        @media (min-width: 768px) {
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

// Extracted DeleteModal component
const DeleteModal = ({
  isOpen,
  onClose,
  onDelete,
  modalRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  modalRef: React.RefObject<HTMLDialogElement | null>;
}) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal">
      <div className="delete-modal__header">
        <h1 className="delete-modal__title">Are you sure you want to delete this thread?</h1>
      </div>
      <div className="delete-modal__body">
        <div className="delete-modal__content">Clicking delete will remove the thread from the list.</div>
      </div>
      <div className="delete-modal__footer">
        <button onClick={onDelete} className="delete-modal__button delete-modal__button--delete">
          Delete
        </button>
        <button onClick={onClose} className="delete-modal__button delete-modal__button--cancel">
          Cancel
        </button>
      </div>
      <style jsx>{`
        .delete-modal {
          width: 85vw;
          background: #ffffff;
          padding: 24px 12px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 85vh;
        }

        .delete-modal__header {
        }

        .delete-modal__title {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          text-align: left;
          color: #0f172a;
        }

        .delete-modal__body {
          flex: 1;
          overflow: auto;
          padding-right: 12px;
        }

        .delete-modal__content {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #0f172a;
        }

        .delete-modal__footer {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 10px 12px 10px 0px;
        }

        .delete-modal__button {
          box-shadow: 0px 1px 1px 0px #0f172a14;
          border: 1px solid #cbd5e1;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          border-radius: 8px;
          padding: 0px 24px;
        }

        .delete-modal__button--delete {
          background-color: #dd2c5a;
          color: #ffffff;
        }

        .delete-modal__button--cancel {
          background-color: #fff;
          color: #0f172a;
        }

        @media (min-width: 768px) {
          .delete-modal {
            width: 656px;
          }

          .delete-modal__footer {
            flex-direction: row-reverse;
            justify-content: end;
            gap: 10px;
          }

          .delete-modal__button--delete {
            width: unset;
          }

          .delete-modal__button--cancel {
            width: unset;
          }
        }
      `}</style>
    </div>
  );
};

export default AppSidebar;
