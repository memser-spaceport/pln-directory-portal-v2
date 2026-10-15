'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { PAGE_ROUTES } from '@/utils/constants';
import { AI_SEARCH_HISTORY_PARAM } from '@/components/constants/aiSearchHandoff';

import { triggerLoader } from '@/utils/common.utils';
import { getUserCredentials } from '@/utils/auth.utils';
import { getHuskyHistory, deleteThread } from '@/services/husky.service';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { useLoginRedirect } from '@/components/core/login/utils';

import { ConfirmDialog } from '@/components/core/ConfirmDialog';

import type { IHistoryThread } from './types/historyThread';

import { OPEN_VISIT_CHAT_EVENT } from '../constants/visitChats';

import { getVisitChats } from '../utils/getVisitChats';
import { removeVisitChat } from '../utils/removeVisitChat';
import { groupThreadsByDate } from './utils/groupThreadsByDate';
import { setPendingVisitChat } from '../utils/setPendingVisitChat';

import { useSidebar } from '../hooks/useSidebar';

import { Sidebar } from '../Sidebar';
import { ThreadItem } from './components/ThreadItem';
import { HistorySearch } from './components/HistorySearch';
import { SkeletonLoader } from './components/SkeletonLoader';

import s from './AppSidebar.module.scss';

type DeleteTarget = Pick<IHistoryThread, 'threadId' | 'title'>;

interface Props {
  isLoggedIn: boolean;
}

export const AppSidebar = (props: Props) => {
  const { isLoggedIn } = props;

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
    const toastId = toast.loading('Deleting thread...');

    try {
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
      await fetchHistory(false);

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
    fetchHistory(true);

    const handleRefreshHistory = (e: Event) => {
      const openThreadId = (e as CustomEvent<{ openThreadId?: string }>).detail?.openThreadId;
      if (openThreadId) {
        setAnnouncedChatId(openThreadId);
      }
      fetchHistory(false);
    };

    const handleDeleteRequest = (e: CustomEvent<DeleteTarget>) => {
      setDeleteTarget(e.detail);
    };

    setIsMac(/Mac/i.test(navigator.userAgent));

    const handleNewChat = () => setAnnouncedChatId(null);

    document.addEventListener('refresh-husky-history', handleRefreshHistory as EventListener);
    document.addEventListener('delete-thread', handleDeleteRequest as EventListener);
    document.addEventListener('new-chat', handleNewChat);

    return () => {
      document.removeEventListener('refresh-husky-history', handleRefreshHistory as EventListener);
      document.removeEventListener('delete-thread', handleDeleteRequest as EventListener);
      document.removeEventListener('new-chat', handleNewChat);
    };
  }, []);

  return (
    <>
      <Sidebar>
        <div data-state={state} className={s.header}>
          <div className={s.logoContainer}>
            <span className={s.title}>
              <span className={s.titleIcon} aria-hidden="true" />
              AI Search
            </span>
            <button className={s.logoIconButton} onClick={handleSidebarToggle}>
              <img src="/icons/sidenav-close.svg" alt="toggle sidebar" />
            </button>
          </div>
          <button onClick={handleNewConversation} className={s.newChat}>
            <span className={s.newChatIcon} aria-hidden="true" />
            <span className={s.newChatText}>New chat</span>
          </button>
        </div>
        <div data-state={state} className={s.body}>
          <div className={s.history}>
            <div className={s.search}>
              <HistorySearch value={query} onChange={setQuery} />
            </div>
            <div onClick={handleOpenSidebar} className={s.historyHeader}>
              <div className={s.historyTitle}>
                <img width={22} height={22} src="/icons/history.svg" alt="history" />
                <span className={s.historyTitleText}>{isLoggedIn ? 'History' : 'This visit'}</span>
              </div>
            </div>
            <div className={s.list}>
              {isLoading ? (
                <SkeletonLoader />
              ) : history.length === 0 ? (
                <div className={s.empty}>
                  {isLoggedIn
                    ? 'Your conversations will appear here once you start chatting!'
                    : 'Chats you start appear here.'}
                </div>
              ) : shownHistory.length === 0 ? (
                <div className={s.empty}>No chats match &ldquo;{query.trim()}&rdquo;.</div>
              ) : !isLoggedIn ? (
                <ul className={s.threads}>
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
                  <div key={label} className={s.group}>
                    <div className={s.groupLabel}>{label}</div>
                    <ul className={s.threads}>
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
              <div className={s.keep}>
                <p className={s.keepTitle}>Sign in to keep your chats</p>
                <p className={s.keepText}>
                  Chats you start signed out are gone when you leave. Signed in, every chat is kept here with its own
                  link.
                </p>
                <div className={s.keepActions}>
                  <button type="button" onClick={handleSignUp} className={s.signUp}>
                    Sign up
                  </button>
                  <button type="button" onClick={() => goToLogin()} className={s.signIn}>
                    Sign in
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div data-state={state} className={s.footer}>
          <div className={s.shortcut}>
            <div className={s.shortcutKey}>{isMac ? '⌘' : 'Ctrl'}</div>
            <span className={s.shortcutPlus}>+</span>
            <div className={s.shortcutKey}>B</div>
            <span className={s.shortcutText}>to expand/collapse</span>
          </div>
          <button className={s.toggleSidebar} onClick={handleSidebarToggle}>
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
    </>
  );
};
