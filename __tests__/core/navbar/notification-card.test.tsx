import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import NotificationCard from '@/components/core/navbar/notification-card';
import { NOTIFICATION_TYPES } from '@/utils/constants';
import type { IFollowUp } from '@/types/officehours.types';

jest.mock('@/hooks/useDefaultAvatar', () => ({ useDefaultAvatar: () => '/avatar.svg' }));

it('shows a member name with markup as literal text', () => {
  const name = '<img src=x onerror=alert(1)>';
  const notification = {
    type: NOTIFICATION_TYPES.meetingInitiated.name,
    createdAt: new Date().toISOString(),
    interaction: { targetMember: { name } },
  } as unknown as IFollowUp;

  const { container } = render(<NotificationCard notification={notification} />);

  expect(screen.getByText(`Did you schedule Office Hours with ${name}?`)).toBeInTheDocument();
  expect(container.querySelectorAll('img')).toHaveLength(1);
});
