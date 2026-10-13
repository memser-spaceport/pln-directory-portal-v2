import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';

import { NotificationItem } from '@/components/core/UpdatesPanel/NotificationItem';
import { GantryIcon, NewsIcon, SystemIcon } from '@/components/core/UpdatesPanel/icons';
import { PushNotification } from '@/types/push-notifications.types';

function notificationOf(category: string) {
  return {
    id: `n-${category}`,
    category,
    title: 'Title',
    description: 'Description',
    link: '/home',
    isRead: false,
    createdAt: new Date().toISOString(),
  } as unknown as PushNotification;
}

function renderedIcon(category: string) {
  const { container } = render(
    <NotificationItem notification={notificationOf(category)} onNotificationClick={jest.fn()} />,
  );
  return container.querySelector('svg')?.outerHTML;
}

function markupOf(Icon: () => React.JSX.Element) {
  return render(<Icon />).container.querySelector('svg')?.outerHTML;
}

describe('NotificationItem — category icons', () => {
  it('shows the Gantry lightbulb for Gantry notifications', () => {
    expect(renderedIcon('GANTRY')).toBe(markupOf(GantryIcon));
  });

  it('shows the newspaper for Network News notifications', () => {
    expect(renderedIcon('TEAM_NEWS')).toBe(markupOf(NewsIcon));
  });

  it('keeps the system icon for New Feature notifications', () => {
    expect(renderedIcon('NEW_FEATURE')).toBe(markupOf(SystemIcon));
  });

  it('falls back to the system icon for an unknown category', () => {
    expect(renderedIcon('SOMETHING_NEW')).toBe(markupOf(SystemIcon));
  });

  it('draws the Gantry and news icons in the notification blue at 22px', () => {
    for (const Icon of [GantryIcon, NewsIcon]) {
      const svg = render(<Icon />).container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '22');
      expect(svg).toHaveAttribute('height', '22');
      svg?.querySelectorAll('path').forEach((path) => expect(path).toHaveAttribute('stroke', '#1B4DFF'));
    }
  });
});
