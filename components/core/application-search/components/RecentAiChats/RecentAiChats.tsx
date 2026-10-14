import { format, isToday, isYesterday } from 'date-fns';

import { useChatHistory } from '@/services/search/hooks/useChatHistory';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';

import s from './RecentAiChats.module.scss';

const SHOWN_CHATS = 3;

interface Props {
  onOpenChat: (threadId: string) => void;
  onShowAll: () => void;
}

function whenLabel(createdAt: string) {
  const date = new Date(createdAt);
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d');
}

export const RecentAiChats = (props: Props) => {
  const { onOpenChat, onShowAll } = props;

  const { data: chats } = useChatHistory();
  const analytics = useUnifiedSearchAnalytics();

  if (!chats?.length) {
    return null;
  }

  const latest = [...chats]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, SHOWN_CHATS);

  return (
    <div className={s.root}>
      <div className={s.head}>
        <div className={s.label}>Recent AI Search chats</div>
        <button
          type="button"
          className={s.showAll}
          onClick={() => {
            analytics.onAiConversationHistoryOpenClick();
            onShowAll();
          }}
        >
          All chats ({chats.length})
        </button>
      </div>
      <ul className={s.list}>
        {latest.map((chat) => (
          <li key={chat.threadId}>
            <button
              type="button"
              className={s.row}
              onClick={() => {
                analytics.onAiConversationHistoryClick(chat.title);
                onOpenChat(chat.threadId);
              }}
            >
              <span className={s.aiIcon} aria-hidden="true" />
              <span className={s.title}>{chat.title}</span>
              <span className={s.when}>{whenLabel(chat.createdAt)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
