import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { NotificationItem } from '@/components/core/UpdatesPanel/NotificationItem';
import { PushNotification } from '@/types/push-notifications.types';

const starterKitUpdate = {
  id: 'n-1',
  category: 'AI_APP',
  title: 'Starter Kit v1.17 is out',
  description: "See what's new and download the latest kit — or ask your agent to update an existing one.",
  link: '/pl-infra/ai-apps?dialog=addAiApp',
  linkText: 'Get the starter kit →',
  metadata: { eventType: 'ai_app_starter_kit', trigger: 'starter_kit_updated', version: '1.17' },
  isRead: false,
  createdAt: new Date().toISOString(),
} as unknown as PushNotification;

describe('NotificationItem — AI Apps starter kit update', () => {
  it('shows the AI Apps badge and the notification CTA', () => {
    render(<NotificationItem notification={starterKitUpdate} onNotificationClick={jest.fn()} />);

    expect(screen.getByText('AI Apps')).toBeInTheDocument();
    expect(screen.getByText('Get the starter kit →')).toBeInTheDocument();
  });

  it('links the bell item to the AI Apps page with the Add your AI App modal open', () => {
    const onClick = jest.fn();
    render(<NotificationItem notification={starterKitUpdate} onNotificationClick={onClick} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/pl-infra/ai-apps?dialog=addAiApp');
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledWith(starterKitUpdate);
  });

  it('keeps the dialog parameter on the full notifications page, which adds backTo', () => {
    render(
      <NotificationItem
        notification={starterKitUpdate}
        onNotificationClick={jest.fn()}
        variant="page"
        backTo="/notifications"
      />,
    );

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/pl-infra/ai-apps?dialog=addAiApp&backTo=%2Fnotifications',
    );
  });

  it('shows a single arrow on the notifications page, which draws its own arrow icon', () => {
    render(<NotificationItem notification={starterKitUpdate} onNotificationClick={jest.fn()} variant="page" />);

    expect(screen.getByText('Get the starter kit')).toBeInTheDocument();
    expect(screen.queryByText(/→/)).not.toBeInTheDocument();
  });
});
