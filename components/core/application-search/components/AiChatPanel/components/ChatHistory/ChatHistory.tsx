import React, { useCallback, useMemo, useState } from 'react';

import s from './ChatHistory.module.scss';
import { useChatHistory } from '@/services/search/hooks/useChatHistory';
import { getYear, isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { getHuskyThreadById } from '@/services/husky.service';
import { getUserCredentials } from '@/utils/auth.utils';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';

interface IThread {
  title: string;
  threadId: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onSelect: (thread: Awaited<ReturnType<typeof getHuskyThreadById>>) => void;
  isLoggedIn: boolean;
}

export const ChatHistory = ({ onSelect, isLoggedIn }: Props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const analytics = useUnifiedSearchAnalytics();
  const { data: history, isLoading } = useChatHistory();

  const groupChatsByDate = useCallback((chats: IThread[]) => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);
    const currentYear = getYear(now);

    return (chats ?? []).reduce(
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
      <div className={s.root}>
        {!history?.length && (
          <div className={s.centered}>
            <NothingFound />
          </div>
        )}
        {orderedKeys.map((key) =>
          groupedChats[key as keyof typeof groupedChats]?.length > 0 ? (
            <React.Fragment key={key}>
              <div className={s.label}>{key === 'lastWeek' ? 'Last 7 days' : key === 'lastMonth' ? 'Last 30 days' : key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : key}</div>
              {groupedChats[key as keyof typeof groupedChats]
                .sort((a: IThread, b: IThread) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by createdAt (newest first)
                .filter((item) => item.title.toLowerCase().includes(searchTerm))
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

                      onSelect(thread);

                      // onSelect(chat.title);
                    }}
                  >
                    {chat.title}
                  </div>
                ))}
            </React.Fragment>
          ) : null,
        )}
      </div>
      <div className={s.inputWrapper} style={{ display: 'none' }}>
        <div className={s.leftIcon}>🧠</div>
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={s.input} placeholder="Search in History" />
        <button className={s.actionButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13.2275 9.54545C13.6793 9.54545 14.0456 9.91177 14.0456 10.3636V11.5909H15.2729C15.7248 11.5909 16.0911 11.9572 16.0911 12.4091C16.0911 12.861 15.7248 13.2273 15.2729 13.2273H14.0456V14.4545C14.0456 14.9064 13.6793 15.2727 13.2275 15.2727C12.7756 15.2727 12.4093 14.9064 12.4093 14.4545V13.2273H11.182C10.7301 13.2273 10.3638 12.861 10.3638 12.4091C10.3638 11.9572 10.7301 11.5909 11.182 11.5909H12.4093V10.3636C12.4093 9.91177 12.7756 9.54545 13.2275 9.54545Z"
              fill="#FFF"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.31836 3C8.67053 3 8.98319 3.22535 9.09455 3.55945L9.88564 5.93272L12.2589 6.7238C12.593 6.83517 12.8184 7.14783 12.8184 7.5C12.8184 7.85217 12.593 8.16483 12.2589 8.2762L9.88564 9.06728L9.09455 11.4405C8.98319 11.7746 8.67053 12 8.31836 12C7.96619 12 7.65353 11.7746 7.54216 11.4405L6.75108 9.06728L4.37781 8.2762C4.04371 8.16483 3.81836 7.85217 3.81836 7.5C3.81836 7.14783 4.04371 6.83517 4.37781 6.7238L6.75108 5.93272L7.54216 3.55945C7.65353 3.22535 7.96619 3 8.31836 3ZM8.31836 6.4055L8.1741 6.83828C8.09266 7.08259 7.90095 7.2743 7.65664 7.35574L7.22386 7.5L7.65664 7.64426C7.90095 7.7257 8.09266 7.91741 8.1741 8.16172L8.31836 8.5945L8.46262 8.16172C8.54406 7.91741 8.73577 7.7257 8.98008 7.64426L9.41286 7.5L8.98008 7.35574C8.73577 7.2743 8.54406 7.08259 8.46262 6.83828L8.31836 6.4055Z"
              fill="#FFF"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.30599 16.3305C9.62551 16.6501 9.62551 17.1681 9.30599 17.4876L6.03327 20.7604C5.71375 21.0799 5.1957 21.0799 4.87618 20.7604C4.55666 20.4408 4.55666 19.9228 4.87618 19.6033L8.14891 16.3305C8.46843 16.011 8.98647 16.011 9.30599 16.3305Z"
              fill="#FFF"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13.6529 6.23271C13.7428 5.78987 14.1746 5.50375 14.6175 5.59365C17.7922 6.23808 20.182 9.04359 20.182 12.4091C20.182 16.25 17.0683 19.3636 13.2274 19.3636C10.1981 19.3636 7.62316 17.4272 6.66884 14.7272C6.51825 14.3012 6.74156 13.8337 7.1676 13.6831C7.59364 13.5325 8.06108 13.7558 8.21167 14.1819C8.94213 16.2486 10.9132 17.7273 13.2274 17.7273C16.1646 17.7273 18.5456 15.3462 18.5456 12.4091C18.5456 9.83715 16.7191 7.68999 14.292 7.1973C13.8491 7.10741 13.563 6.67555 13.6529 6.23271Z"
              fill="#FFF"
            />
          </svg>
        </button>
      </div>
    </>
  );
};

const NothingFound = () => {
  return (
    <svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M41.4998 212.397C49.1158 230.982 61.5338 234.851 70.2646 230.982C87.1497 223.501 131.011 215.142 176.059 234.79C235.722 260.813 248.416 221.551 229.375 181.837C210.333 142.122 203.879 101.96 225.83 79.8328C247.781 57.7056 219.056 23.0908 168.043 59.1224C135.077 82.4074 110.883 77.2225 97.8915 70.64C85.6471 64.4361 72.0299 57.9504 59.2718 63.0144C43.7913 69.1595 37.6915 82.4821 61.2444 112.245C94.6208 154.422 24.4275 170.74 41.4998 212.397Z"
        fill="#F1F5F9"
      />
      <path
        d="M72.5098 121.864H191.038V213.02C191.038 213.205 190.964 213.383 190.833 213.514C190.702 213.646 190.524 213.72 190.338 213.72H73.2098C73.0241 213.72 72.8461 213.646 72.7148 213.514C72.5835 213.383 72.5098 213.205 72.5098 213.02V121.864Z"
        fill="#156FF7"
        fillOpacity="0.25"
      />
      <path d="M161.303 86.1426H106.19L72.5098 121.864H191.038L161.303 86.1426Z" fill="#156FF7" />
      <path d="M83.7363 71.8535L106.19 86.1422L72.5096 121.864L46.9941 102.472L83.7363 71.8535Z" fill="#156FF7" fillOpacity="0.75" />
      <path d="M183.756 71.8535L161.303 86.1422L191.038 121.864L220.498 102.472L183.756 71.8535Z" fill="#156FF7" fillOpacity="0.75" />
      <path
        d="M120.669 72.5844C121.303 72.284 121.796 71.7503 122.045 71.0949C122.295 70.4395 122.281 69.7131 122.007 69.0675L111.906 45.2495C111.763 44.9122 111.553 44.6072 111.289 44.353C111.026 44.0988 110.713 43.9006 110.37 43.7703C110.028 43.6401 109.663 43.5804 109.296 43.5949C108.93 43.6094 108.571 43.6979 108.24 43.8549L106.294 44.7776C105.963 44.9346 105.667 45.1569 105.424 45.4312C105.181 45.7055 104.996 46.0261 104.88 46.3738C104.764 46.7214 104.719 47.0889 104.749 47.4541C104.779 47.8193 104.882 48.1748 105.053 48.4991L117.1 71.3941C117.426 72.0147 117.98 72.4851 118.645 72.7069C119.31 72.9287 120.036 72.8848 120.669 72.5844Z"
        fill="#156FF7"
      />
      <path
        d="M133.334 70.2755C133.792 70.2429 134.221 70.0343 134.529 69.6933C134.837 69.3524 135.002 68.9054 134.989 68.4459L134.49 51.4896C134.483 51.2494 134.427 51.0132 134.326 50.795C134.226 50.5769 134.082 50.3813 133.904 50.2201C133.725 50.059 133.517 49.9355 133.289 49.8572C133.062 49.7788 132.822 49.7472 132.582 49.7642L131.173 49.8646C130.933 49.8817 130.7 49.947 130.486 50.0567C130.272 50.1663 130.083 50.318 129.929 50.5027C129.776 50.6874 129.661 50.9012 129.592 51.1314C129.524 51.3615 129.502 51.6032 129.529 51.8419L131.437 68.6979C131.488 69.1548 131.714 69.5742 132.068 69.8682C132.422 70.1622 132.875 70.3082 133.334 70.2755Z"
        fill="#156FF7"
      />
      <path
        d="M143.11 76.5437C144.372 77.2729 146.142 76.6037 147.125 75.0264L164.564 47.019C165.605 45.3458 165.359 43.3066 164.021 42.5331L162.156 41.4551C160.818 40.6815 158.927 41.4848 157.997 43.2223L142.423 72.3076C141.546 73.9457 141.849 75.8143 143.11 76.5437Z"
        fill="#156FF7"
      />
    </svg>
  );
};
