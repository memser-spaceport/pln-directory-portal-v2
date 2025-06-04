import React, { useCallback, useMemo } from 'react';
import s from '@/components/core/application-search/components/TryAiSearch/TryAiSearch.module.scss';
import Image from 'next/image';
import { useChatHistory } from '@/services/search/hooks/useChatHistory';
import { getYear, isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { getUserCredentials } from '@/utils/auth.utils';
import { getHuskyThreadById } from '@/services/husky.service';
import { useRouter } from 'next/navigation';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';

interface IThread {
  title: string;
  threadId: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onClick: () => void;
  isLoggedIn: boolean;
}

export const AiConversationHistory = ({ onClick, isLoggedIn }: Props) => {
  const { data: history, isLoading } = useChatHistory();
  const router = useRouter();
  const analytics = useUnifiedSearchAnalytics();

  const groupChatsByDate = useCallback((chats: IThread[]) => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);
    const currentYear = getYear(now);

    return (chats ?? []).slice(0, 5).reduce(
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

  return (
    <>
      <button
        className={s.root}
        onClick={() => {
          router.push(`/husky/chat`);
        }}
        id="application-search-try-ai"
      >
        <Image src="/icons/ai-search.svg" alt="Search" width={24} height={24} />
        Conversation History
      </button>
      {!!orderedKeys.length && (
        <div className={s.list}>
          {orderedKeys.map((key) =>
            groupedChats[key as keyof typeof groupedChats]?.length > 0 ? (
              <React.Fragment key={key}>
                <div className={s.label}>{key === 'lastWeek' ? 'Last 7 days' : key === 'lastMonth' ? 'Last 30 days' : key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : key}</div>
                {groupedChats[key as keyof typeof groupedChats]
                  .sort((a: IThread, b: IThread) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by createdAt (newest first)
                  .map((chat: IThread) => (
                    <div
                      key={chat.threadId}
                      className={s.query}
                      onClick={async () => {
                        const { authToken } = await getUserCredentials(isLoggedIn);

                        if (!authToken) {
                          return;
                        }

                        const thread = await getHuskyThreadById(chat.threadId, authToken);

                        analytics.onAiConversationHistoryClick(thread.title);

                        if (!thread) {
                          return;
                        }

                        router.push(`/husky/chat/${thread.threadId}`);
                      }}
                    >
                      {chat.title}
                    </div>
                  ))}
              </React.Fragment>
            ) : null,
          )}
        </div>
      )}
    </>
  );
};
