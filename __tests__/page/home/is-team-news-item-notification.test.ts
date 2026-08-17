import { isTeamNewsItemNotification } from '@/components/page/home/TeamNews/utils/isTeamNewsItemNotification';
import type { PushNotification } from '@/types/push-notifications.types';

function notification(
  partial: Partial<PushNotification> & Pick<PushNotification, 'id' | 'category'>,
): PushNotification {
  return {
    title: 'test',
    isPublic: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('isTeamNewsItemNotification', () => {
  it('matches a mention/reply via metadata.newsItemUid', () => {
    expect(
      isTeamNewsItemNotification(
        notification({
          id: 'n1',
          category: 'TEAM_NEWS',
          metadata: { eventType: 'team_news_mention', newsItemUid: 'news-1' },
          link: '/home?news=news-1',
        }),
        'news-1',
      ),
    ).toBe(true);
  });

  it('matches via link when metadata is missing', () => {
    expect(
      isTeamNewsItemNotification(
        notification({
          id: 'n1',
          category: 'TEAM_NEWS',
          link: '/home?news=news-1',
        }),
        'news-1',
      ),
    ).toBe(true);
  });

  it('does not match a network-news broadcast on /home', () => {
    expect(
      isTeamNewsItemNotification(
        notification({
          id: 'n1',
          category: 'TEAM_NEWS',
          link: '/home',
          metadata: { eventType: 'team_news' },
        }),
        'news-1',
      ),
    ).toBe(false);
  });

  it('does not match a different news item', () => {
    expect(
      isTeamNewsItemNotification(
        notification({
          id: 'n1',
          category: 'TEAM_NEWS',
          link: '/home?news=news-2',
          metadata: { newsItemUid: 'news-2' },
        }),
        'news-1',
      ),
    ).toBe(false);
  });

  it('does not match other categories', () => {
    expect(
      isTeamNewsItemNotification(
        notification({
          id: 'n1',
          category: 'FORUM_POST',
          link: '/home?news=news-1',
          metadata: { newsItemUid: 'news-1' },
        }),
        'news-1',
      ),
    ).toBe(false);
  });
});
