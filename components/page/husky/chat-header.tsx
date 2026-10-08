'use client';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSidebar } from './sidebar';
import { PAGE_ROUTES } from '@/utils/constants';

interface ChatHeaderProps {
  resetChat?: () => void;
  showActions?: boolean;
  isOwnThread?: boolean;
  title?: string;
}

const ChatHeader = ({ resetChat, showActions, title }: ChatHeaderProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();
  const { toggleSidebar } = useSidebar();
  const analytics = useHuskyAnalytics();
  const router = useRouter();

  const handleToggleSidebar = () => {
    toggleSidebar();
    analytics.trackMobileHeaderToggleClicked();
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleDelete = () => {
    // Implement delete functionality
    setShowMenu(false);
    document.dispatchEvent(new CustomEvent('delete-thread', { detail: { threadId: id } }));
    analytics.trackMobileDeleteThread(id as string, title ?? '');
  };

  const handleNewConversation = () => {
    if (resetChat) {
      resetChat();
    } else {
      router.push(PAGE_ROUTES.HUSKY);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // On tablet and desktop the History rail holds History and New chat, so the bar shows only for an open chat.
  const hasTitleBar = !!title || !!showActions;

  return (
    <div className={`chat-header${hasTitleBar ? '' : ' chat-header--phone-only'}`}>
      <div className="chat-header__start">
        <button onClick={handleToggleSidebar} className="chat-header__thread-list-button">
          <img src="/icons/message-blue-v2.svg" alt="thread-list" />
          <span className="chat-header__thread-list-button__text">History</span>
        </button>
        {title && (
          <h1 className="chat-header__title" title={title}>
            {title}
          </h1>
        )}
      </div>
      <div className="chat-header__actions">
        <button onClick={handleNewConversation} className="chat-header__new-conversation-button">
          <img src="/icons/add-blue.svg" alt="new-conversation" />
          <span className="chat-header__new-conversation-button__text">New chat</span>
        </button>
        {showActions && (
          <div className="chat-header__menu-container" ref={menuRef}>
            <button onClick={toggleMenu} className="chat-header__menu-button">
              <img src="/icons/menu-dots.svg" alt="more options" />
            </button>
            {showMenu && (
              <div className="chat-header__dropdown-menu">
                <button onClick={handleDelete} className="chat-header__dropdown-item">
                  <img src="/icons/delete.svg" alt="delete" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          height: 40px;
          background-color: #dbeafe;
          padding: 8px 12px;
          position: sticky;
          top: var(--app-header-height);
          z-index: 1;
        }

        .chat-header__start {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .chat-header__title {
          flex: 1;
          min-width: 0;
          margin: 0;
          color: #0f172a;
          font-weight: 600;
          font-size: 14px;
          line-height: 20px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-header__actions {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          gap: 8px;
          position: relative;
        }

        .chat-header__thread-list-button,
        .chat-header__new-conversation-button {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 4px;
          height: 30px;
          background-color: #fff;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          padding: 3px 8px;
        }

        .chat-header__thread-list-button__text,
        .chat-header__new-conversation-button__text {
          font-weight: 500;
          font-size: 13px;
          line-height: 14px;
          color: #156ff7;
        }

        .chat-header__menu-container {
          position: relative;
        }

        .chat-header__menu-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 30px;
          background-color: #fff;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          padding: 3px;
        }

        .chat-header__dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 4px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          width: 91px;
          z-index: 10;
          padding: 4px;
        }

        .chat-header__dropdown-item {
          display: flex;
          align-items: center;
          gap: 4px;
          width: 100%;
          padding: 8px;
          border: none;
          text-align: left;
          background: none;
          cursor: pointer;
          color: #0f172a;
          font-size: 14px;
          line-height: 20px;
          border-radius: 4px;
        }

        .chat-header__dropdown-item:hover {
          background-color: #f1f5f9;
        }

        .chat-header__dropdown-item img {
          width: 16px;
          height: 16px;
        }

        button {
          background-color: transparent;
          cursor: pointer;
        }

        @media (min-width: 768px) {
          .chat-header {
            height: 48px;
            padding: 8px 24px;
            background-color: #ffffff;
            border-bottom: 1px solid rgba(27, 56, 96, 0.12);
          }

          .chat-header--phone-only,
          .chat-header__thread-list-button,
          .chat-header__new-conversation-button {
            display: none;
          }

          .chat-header__title {
            font-size: 16px;
            line-height: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatHeader;
