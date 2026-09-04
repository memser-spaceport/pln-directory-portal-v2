import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PostNewsModal } from '@/components/page/team-details/TeamNews/PostNewsModal/PostNewsModal';
import type { ITeamNewsItem } from '@/types/team-news.types';

jest.mock('@/components/form/FormEditor/FormEditor', () => ({
  FormEditor: ({ name, placeholder }: { name: string; placeholder: string }) => {
    const { useFormContext } = require('react-hook-form');
    const { setValue, watch } = useFormContext();
    return (
      <textarea
        aria-label="Body"
        placeholder={placeholder}
        value={watch(name) ?? ''}
        onChange={(e) => setValue(name, e.target.value, { shouldDirty: true, shouldValidate: true })}
      />
    );
  },
}));

const existingItem: ITeamNewsItem = {
  uid: 'news-1',
  teamUid: 'team-1',
  teamName: 'Protocol Labs',
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT',
  eventDate: '2026-01-15T00:00:00.000Z',
  title: 'Existing launch',
  summary: 'Already posted',
  sourceUrl: 'https://example.com/existing',
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-01-15T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
};

describe('PostNewsModal', () => {
  it('requires headline and link; body stays optional', async () => {
    const onPublish = jest.fn();
    render(
      <PostNewsModal
        open
        onClose={jest.fn()}
        teamUid="team-1"
        teamName="Protocol Labs"
        existing={[]}
        onPublish={onPublish}
      />,
    );

    const post = screen.getByRole('button', { name: 'Post' });
    expect(post).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'New launch' } });
    fireEvent.change(screen.getByLabelText('Link'), { target: { value: 'https://example.com/new' } });

    await waitFor(() => expect(post).toBeEnabled());

    fireEvent.click(post);

    await waitFor(() =>
      expect(onPublish).toHaveBeenCalledWith({
        title: 'New launch',
        body: '',
        url: 'https://example.com/new',
      }),
    );
  });

  it('blocks duplicate URLs already on the team feed', async () => {
    render(
      <PostNewsModal
        open
        onClose={jest.fn()}
        teamUid="team-1"
        teamName="Protocol Labs"
        existing={[existingItem]}
        onPublish={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'Duplicate' } });
    fireEvent.change(screen.getByLabelText('Link'), {
      target: { value: 'https://example.com/existing?utm=1' },
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Post' })).toBeDisabled());
  });
});
