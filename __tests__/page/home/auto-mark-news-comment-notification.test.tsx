import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { useMemo, type ReactNode } from 'react';

import { AutoMarkNewsCommentNotification } from '@/components/page/home/TeamNews/AutoMarkNewsCommentNotification';
import { PushNotificationsContext } from '@/providers/PushNotificationsProvider/PushNotificationsContext';
import type { PushNotification } from '@/types/push-notifications.types';
import type { PushNotificationsContextValue } from '@/providers/PushNotificationsProvider/types';

function notification(
  partial: Partial<PushNotification> & Pick<PushNotification, 'id' | 'category' | 'isRead'>,
): PushNotification {
  return {
    title: 'test',
    isPublic: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

function Provider({
  notifications,
  markAsRead,
  children,
}: {
  notifications: PushNotification[];
  markAsRead: (id: string) => void;
  children: ReactNode;
}) {
  const value = useMemo(
    () =>
      ({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
        isConnected: true,
        isLoading: false,
        error: null,
        markAsRead,
        markAllAsRead: async () => undefined,
        refreshNotifications: async () => undefined,
      }) as PushNotificationsContextValue,
    [notifications, markAsRead],
  );

  return <PushNotificationsContext.Provider value={value}>{children}</PushNotificationsContext.Provider>;
}

describe('AutoMarkNewsCommentNotification', () => {
  it('marks matching unread mention when that story modal is open', () => {
    const markAsRead = jest.fn();
    const notifications = [
      notification({
        id: 'mention-1',
        category: 'TEAM_NEWS',
        isRead: false,
        link: '/home?news=news-1',
        metadata: { eventType: 'team_news_mention', newsItemUid: 'news-1' },
      }),
      notification({
        id: 'broadcast',
        category: 'TEAM_NEWS',
        isRead: false,
        link: '/home',
        metadata: { eventType: 'team_news' },
      }),
      notification({
        id: 'other',
        category: 'TEAM_NEWS',
        isRead: false,
        link: '/home?news=news-2',
        metadata: { eventType: 'team_news_reply', newsItemUid: 'news-2' },
      }),
    ];

    render(
      <Provider notifications={notifications} markAsRead={markAsRead}>
        <AutoMarkNewsCommentNotification newsItemUid="news-1" />
      </Provider>,
    );

    expect(markAsRead).toHaveBeenCalledTimes(1);
    expect(markAsRead).toHaveBeenCalledWith('mention-1');
  });

  it('does nothing when no story modal is open', () => {
    const markAsRead = jest.fn();
    render(
      <Provider
        notifications={[
          notification({
            id: 'mention-1',
            category: 'TEAM_NEWS',
            isRead: false,
            link: '/home?news=news-1',
            metadata: { newsItemUid: 'news-1' },
          }),
        ]}
        markAsRead={markAsRead}
      >
        <AutoMarkNewsCommentNotification newsItemUid={null} />
      </Provider>,
    );

    expect(markAsRead).not.toHaveBeenCalled();
  });

  it('does nothing without a notifications provider', () => {
    expect(() => render(<AutoMarkNewsCommentNotification newsItemUid="news-1" />)).not.toThrow();
  });
});
