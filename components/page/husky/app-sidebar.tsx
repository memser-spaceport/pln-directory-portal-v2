'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar, useSidebar } from './sidebar';
import { getYear, isYesterday, isToday, subMonths, subWeeks } from 'date-fns';
import { getHuskyHistory } from '@/services/husky.service';
import { getUserCredentials } from '@/utils/auth.utils';
import { triggerLoader } from '@/utils/common.utils';

interface IThread {
  _id: string;
  title: string;
  createdAt: string;
  threadUid: string;
}

interface ThreadItemProps {
  thread: IThread;
  isActive: boolean;
  setThreadUid: (threadUid: string) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

const ThreadItem = ({ thread, isActive, setThreadUid, isMobile, toggleSidebar }: ThreadItemProps) => {
  const handleClick = (thread: any) => {
    if (!isActive) {
      triggerLoader(true);

      setThreadUid(thread.threadUid);
      document.dispatchEvent(new CustomEvent('update-messages', { detail: thread }));
      if (isMobile) {
        toggleSidebar();
      }
    }
  };

  return (
    <li key={thread._id} data-active={isActive} className="sidebar__body__history__list__ul__li" onClick={() => handleClick(thread)}>
      <span className="sidebar__body__history__list__ul__li__text">{thread.title}</span>
      <style jsx>{`
        .sidebar__body__history__list__ul__li {
          list-style: none;
          color: #64748b;
          font-weight: 400;
          font-size: 14px;
          line-height: 22px;
          padding: 4px 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }

        .sidebar__body__history__list__ul__li:hover {
          background-color: #f1f5f9;
          border-radius: 4px;
        }

        .sidebar__body__history__list__ul__li[data-active='true'] {
          background-color: #f1f5f9;
          border-radius: 4px;
        }
      `}</style>
    </li>
  );
};

const AppSidebar = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const { toggleSidebar, state, isMobile } = useSidebar();
  const [history, setHistory] = useState<IThread[]>([]);
  // const [isCollapsed, setIsCollapsed] = useState(true);
  const [threadUid, setThreadUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }

      const { userInfo, authToken } = await getUserCredentials(isLoggedIn);
      const res = await getHuskyHistory(authToken, userInfo.email);

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

  const handleNewConversation = () => {
    if (isMobile) {
      toggleSidebar();
    }
    setThreadUid(null);
    document.dispatchEvent(new CustomEvent('new-chat'));
  };

  const groupChatsByDate = (chats: IThread[]): any => {
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
        chat: IThread
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
      }
    );
  };

  // const handleCollapse = () => {
  //   setIsCollapsed(!isCollapsed);
  // };

  useEffect(() => {
    fetchHistory(true); // Show loading on initial fetch

    const handleRefreshHistory = () => {
      fetchHistory(false); // Don't show loading when called via event listener
    };

    document.addEventListener('refresh-husky-history', handleRefreshHistory);
    return () => {
      document.removeEventListener('refresh-husky-history', handleRefreshHistory);
    };
  }, []);
  return (
    <>
      <Sidebar>
        <div data-state={state} className="sidebar__header">
          <div className="sidebar__header__logo-container">
            <img className="sidebar__header__logo" src="/images/husky-logo.svg" alt="logo" />
            <img className="sidebar__header__logo-icon" src="/icons/husky-face.svg" alt="logo" />
            <button className="sidebar__header__logo-icon-button" onClick={toggleSidebar}>
              <img src="/icons/sidenav-close.svg" alt="toggle sidebar" />
            </button>
          </div>
          <button onClick={handleNewConversation} className="sidebar__header__newConversation">
            <img src="/icons/add.svg" alt="plus" />
            <span className="sidebar__header__newConversation__text">New Conversation</span>
          </button>
        </div>
        <div data-state={state} className="sidebar__body">
          <div className="sidebar__body__history">
            <div className="sidebar__body__history__header">
              <div className="sidebar__body__history__header__title">
                <img width={22} height={22} src="/icons/history.svg" alt="history" />
                <span className="sidebar__body__history__header__title__text">History</span>
              </div>
              {/* <div className="sidebar__body__history__header__actions">
                <button onClick={handleCollapse} className="sidebar__body__history__header__actions__button">
                  <img src="/icons/down-arrow-grey.svg" alt="arrow" />
                </button>
              </div> */}
            </div>
            {/* {isCollapsed && ( */}
            <div className="sidebar__body__history__list">
              {isLoading ? (
                <>
                  {[68, 54, 28, 64, 52].map((item) => (
                    <div key={item} className="skeleton-wrapper">
                      <div className="skeleton" style={{ width: `${item}%` }} />
                    </div>
                  ))}
                </>
              ) : history.length === 0 ? (
                <div className="sidebar__body__history__list__empty">No history found</div>
              ) : (
                <ul className="sidebar__body__history__list__ul">
                  {history &&
                    (() => {
                      const groupedChats = groupChatsByDate(history);
                      // Define the fixed order for sections
                      const orderedKeys = ['today', 'yesterday', 'lastWeek', 'lastMonth'];

                      // Get dynamically generated year sections and sort in descending order (e.g., 2024, 2023, 2022)
                      const yearKeys = Object.keys(groupedChats)
                        .filter((key) => !orderedKeys.includes(key)) // Exclude predefined sections
                        .sort((a, b) => Number(b) - Number(a)); // Sort years in descending order

                      // Combine fixed sections with dynamically sorted years
                      const finalKeys = [...orderedKeys, ...yearKeys];

                      return finalKeys.map((key) =>
                        groupedChats[key]?.length > 0 ? (
                          <React.Fragment key={key}>
                            <div className="sidebar__body__history__list__ul__title">
                              {key === 'lastWeek' ? 'Last 7 days' : key === 'lastMonth' ? 'Last 30 days' : key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : key}
                            </div>
                            {groupedChats[key]
                              .sort((a: IThread, b: IThread) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by createdAt (newest first)
                              .map((chat: IThread) => (
                                <ThreadItem isActive={chat.threadUid === threadUid} key={chat._id} thread={chat} setThreadUid={setThreadUid} isMobile={isMobile} toggleSidebar={toggleSidebar} />
                              ))}
                          </React.Fragment>
                        ) : null
                      );
                    })()}
                </ul>
              )}
            </div>
            {/* )} */}
          </div>
        </div>
        <div data-state={state} className="sidebar__footer">
          <button className="sidebar__footer__toggleSidebar" onClick={toggleSidebar}>
            <img src="/icons/sidenav-close.svg" alt="toggle sidebar" />
          </button>
        </div>
      </Sidebar>
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
          justify-content: space-between;
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
          // border-radius: 4px;
        }

        .sidebar__header__newConversation__text {
          font-weight: 500;
          font-size: 13px;
          line-height: 14px;
          color: #156ff7;
        }

        .sidebar__header__logo-icon {
          display: none;
        }

        .sidebar__body {
          flex: 1;
          padding: 0px 8px 10px 18px;
          overflow-y: auto;
        }

        .sidebar__body__history__list__empty {
          display: flex;
          // align-items: center;
          justify-content: center;
          height: 100%;
          color: #64748b;
          padding-top: 90px;
        }

        .sidebar__body__history {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .sidebar__body__history__list {
          flex: 1;
          overflow-y: auto;
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

        .sidebar__body__history__list__ul__li__text {
        }

        .sidebar__body__history__list__ul__li:hover {
          background-color: #f1f5f9;
          border-radius: 4px;
        }

        .sidebar__footer {
          display: none;
          height: 64px;
          align-items: center;
          justify-content: end;
          border-top: 0.5px solid #cbd5e1;
          padding-right: 20px;
        }

        button {
          background-color: transparent;
        }

        .container {
          display: flex;
          flex-direction: column;
        }
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

        @media (min-width: 768px) {
          .sidebar__header__logo-icon {
            display: block;
          }
          .sidebar__header[data-state='collapsed'] .sidebar__header__logo-container {
            height: 60px;
            padding-bottom: 0px;
          }

          .sidebar__header[data-state='collapsed'] .sidebar__header__logo {
            display: none;
          }

          .sidebar__header[data-state='expanded'] .sidebar__header__logo-icon {
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
            padding-right: unset;
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

          .sidebar__header__logo-icon-button {
            display: none;
          }

          .sidebar__header__logo-container {
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
};

export default AppSidebar;
