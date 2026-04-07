import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RequestGuide from '@/components/page/founder-guides/RequestGuide/RequestGuide';

const mockPush = jest.fn();
const mockMutate = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/services/guide-requests/hooks/useRequestGuideMutation', () => ({
  useRequestGuideMutation: () => ({ mutate: mockMutate, isPending: false }),
}));

jest.mock('@/analytics/founder-guides.analytics', () => ({
  useFounderGuidesAnalytics: () => ({
    trackRequestGuidePageViewed: jest.fn(),
    trackRequestGuideFormFieldEdited: jest.fn(),
    trackRequestGuideSubmitted: jest.fn(),
    trackRequestGuideCancelled: jest.fn(),
  }),
}));

describe('RequestGuide', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('blocks typing past the topic and description character limits', async () => {
    const user = userEvent.setup();

    render(<RequestGuide />);

    const topicInput = screen.getByLabelText('Topic');
    const descriptionInput = screen.getByLabelText('What would you like this guide to help with?');

    await user.type(topicInput, 'a'.repeat(120));
    await user.type(descriptionInput, 'b'.repeat(650));

    expect(topicInput).toHaveValue('a'.repeat(100));
    expect(descriptionInput).toHaveValue('b'.repeat(600));
  });
});
