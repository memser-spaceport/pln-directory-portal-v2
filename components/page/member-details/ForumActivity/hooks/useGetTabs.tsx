import { useMemo } from 'react';

import { Badge } from '@/components/common/Badge';

interface Input {
  activeTab: string;
  postsCount: number;
  commentsCount: number;
}

export function useGetTabs(input: Input) {
  const { activeTab, postsCount, commentsCount } = input;

  const tabs = useMemo(() => {
    return [
      {
        label: 'Posts',
        value: 'posts',
        badge: <Badge variant={activeTab === 'posts' ? 'brand' : 'default'}>{postsCount}</Badge>,
      },
      {
        label: 'Comments',
        value: 'comments',
        badge: <Badge variant={activeTab === 'comments' ? 'brand' : 'default'}>{commentsCount}</Badge>,
      },
    ]
  }, [activeTab, postsCount, commentsCount])

  return tabs;
}
