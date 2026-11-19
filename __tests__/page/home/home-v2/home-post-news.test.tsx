import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { HomePostNews } from '@/components/page/home/HomeV2/HomePostNews';
import { useCurrentUserStore } from '@/services/auth/store';
import type { ITeamNewsItem } from '@/types/team-news.types';

/**
 * LAB-3342: "Post news" on the signed-in Home, for team leads. The header placement, the stream and the phone layout
 * are in signed-in-home.test.tsx; here are the button, the form and the events. IDs R1–R9 are the ticket's.
 */

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

// The callout is open: Home must still show no "New" tip, and must not dismiss the team page's.
const mockDismiss = jest.fn();
jest.mock('@/hooks/useOneTimeCallout', () => ({
  useOneTimeCallout: () => ({ open: true, dismiss: mockDismiss }),
}));

const mockCreateClicked = jest.fn();
const mockSubmitted = jest.fn();
jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsCreateClicked: mockCreateClicked,
    onTeamNewsCreatePostSubmitted: mockSubmitted,
  }),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }),
}));
const { toast } = jest.requireMock('@/components/core/ToastContainer');

// The publish API: a mutation fake with the real hook's shape (`mutateAsync`, `isPending`).
const mockCreatePost = jest.fn();
jest.mock('@/services/team-news/hooks/useCreateTeamNewsPost', () => {
  const { useState } = jest.requireActual('react');
  return {
    useCreateTeamNewsPost: (teamUid: string) => {
      const [isPending, setPending] = useState(false);
      return {
        isPending,
        mutateAsync: async ({ teamUid: target, ...payload }: { teamUid?: string }) => {
          setPending(true);
          try {
            return await mockCreatePost(target || teamUid, payload);
          } finally {
            setPending(false);
          }
        },
      };
    },
  };
});

// The member's record (names, main team) and each team (logo).
let mockMemberRoles: unknown[] = [];
jest.mock('@/services/members/hooks/useMember', () => ({
  useMember: (uid: string | undefined) => ({
    data: uid ? { memberInfo: { teamMemberRoles: mockMemberRoles } } : undefined,
  }),
}));
const LOGOS: Record<string, string> = {
  'team-a': 'https://cdn.example.com/a.png',
  'team-b': 'https://cdn.example.com/b.png',
};
jest.mock('@/services/teams.service', () => ({
  getTeam: (uid: string) =>
    Promise.resolve({ data: { formatedData: { id: uid, name: `Team ${uid}`, logo: LOGOS[uid] } } }),
}));

const role = (teamUid: string, name: string, extra: Record<string, unknown> = {}) => ({
  teamUid,
  teamTitle: name,
  team: { uid: teamUid, name },
  teamLead: true,
  ...extra,
});

const created = (teamUid: string, teamName: string): ITeamNewsItem => ({
  uid: 'news-new',
  teamUid,
  teamName,
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT',
  eventDate: '2026-11-19T12:00:00.000Z',
  title: 'We shipped v2',
  summary: null,
  sourceUrl: 'https://example.com/v2',
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-11-19T12:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
});

const setUser = (user: Record<string, unknown> | null) =>
  useCurrentUserStore.setState({ currentUser: user as never, isHydrated: true });

function renderPostNews(onPosted = jest.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <HomePostNews existing={[]} onPosted={onPosted} />
    </QueryClientProvider>,
  );
  return { ...view, onPosted };
}

const postButton = () => screen.queryByRole('button', { name: /post news/i });

async function fillForm() {
  fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'We shipped v2' } });
  fireEvent.change(screen.getByLabelText('Link'), { target: { value: 'https://example.com/v2' } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Post' })).toBeEnabled());
}

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof ResizeObserver;
});

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockMemberRoles = [role('team-a', 'Alpha Labs', { mainTeam: true })];
  setUser({ uid: 'lead-1', leadingTeams: ['team-a'] });
});

afterEach(() => {
  useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
});

describe('R2: no button for anyone who leads no team', () => {
  it('a member who leads no team sees no button and the component renders nothing', () => {
    mockMemberRoles = [role('team-a', 'Alpha Labs', { teamLead: false, mainTeam: true })];
    setUser({ uid: 'member-1', leadingTeams: [] });
    const { container } = renderPostNews();
    expect(postButton()).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('an admin who leads no team sees no button', () => {
    setUser({ uid: 'admin-1', roles: ['DIRECTORYADMIN'], leadingTeams: [] });
    const { container } = renderPostNews();
    expect(postButton()).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('a signed-out visitor sees no button', () => {
    setUser(null);
    const { container } = renderPostNews();
    expect(postButton()).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });
});

describe('R1: a team lead sees the button', () => {
  it('shows the production "Post news" button at Home size, with no one-time tip', () => {
    renderPostNews();
    const button = postButton();
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('postAction', 'homePostAction');
    expect(screen.queryByText(/It reaches your followers/)).toBeNull();
  });
});

describe('R3: a lead of one team', () => {
  it('opens the existing post-news form with that team set, and no "Post as"', async () => {
    renderPostNews();
    fireEvent.click(postButton()!);
    expect(await screen.findByRole('heading', { name: 'Post news' })).toBeInTheDocument();
    expect(screen.getByText('Published as Alpha Labs, to its followers and the network feed.')).toBeInTheDocument();
    expect(screen.queryByText('Post as')).toBeNull();
    // The press does not dismiss the team page's callout.
    expect(mockDismiss).not.toHaveBeenCalled();
  });
});

describe('R4: a lead of several teams', () => {
  beforeEach(() => {
    mockMemberRoles = [role('team-b', 'Beta Works'), role('team-a', 'Alpha Labs', { mainTeam: true })];
    setUser({ uid: 'lead-1', leadingTeams: ['team-b', 'team-a'] });
  });

  it('shows "Post as" on top, on the main team, with the team logo in the chosen value', async () => {
    renderPostNews();
    fireEvent.click(postButton()!);
    expect(await screen.findByText('Post as')).toBeInTheDocument();
    expect(screen.getByText('Published as Alpha Labs, to its followers and the network feed.')).toBeInTheDocument();
    const field = document.getElementById('postAs')!.closest('[class*="field"]') as HTMLElement;
    expect(within(field).getByText('Alpha Labs')).toBeInTheDocument();
    await waitFor(() => expect(field.querySelector('img')).toHaveAttribute('src', 'https://cdn.example.com/a.png'));
  });

  it('lists every lead team with its logo, and posts as the chosen team', async () => {
    mockCreatePost.mockResolvedValue(created('team-b', 'Beta Works'));
    renderPostNews();
    fireEvent.click(postButton()!);
    await screen.findByText('Post as');
    await waitFor(() => expect(document.querySelector('img[src="https://cdn.example.com/a.png"]')).not.toBeNull());

    fireEvent.keyDown(document.getElementById('postAs')!, { key: 'ArrowDown' });
    const listbox = await screen.findByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['Alpha Labs', 'Beta Works']);
    expect(options[1].querySelector('img')).toHaveAttribute('src', 'https://cdn.example.com/b.png');
    fireEvent.click(options[1]);

    expect(screen.getByText('Published as Beta Works, to its followers and the network feed.')).toBeInTheDocument();
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() =>
      expect(mockCreatePost).toHaveBeenCalledWith('team-b', {
        title: 'We shipped v2',
        body: undefined,
        url: 'https://example.com/v2',
      }),
    );
    await waitFor(() => expect(mockSubmitted).toHaveBeenCalledWith('team-b', 'Beta Works', 'home'));
  });
});

describe('R5: while sending', () => {
  it('reads "Posting…" and Cancel is off', async () => {
    let finish: (item: ITeamNewsItem) => void = () => undefined;
    mockCreatePost.mockReturnValue(new Promise<ITeamNewsItem>((resolve) => (finish = resolve)));
    renderPostNews();
    fireEvent.click(postButton()!);
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    expect(await screen.findByRole('button', { name: 'Posting…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

    await act(async () => finish(created('team-a', 'Alpha Labs')));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Post news' })).toBeNull());
  });
});

describe('R6: after success', () => {
  it('closes the form, shows a toast and hands the new story to Home', async () => {
    const item = created('team-a', 'Alpha Labs');
    mockCreatePost.mockResolvedValue(item);
    const { onPosted } = renderPostNews();
    fireEvent.click(postButton()!);
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Post news' })).toBeNull());
    expect(toast.success).toHaveBeenCalledWith('Posted as Alpha Labs. It’s on the network feed now.');
    expect(onPosted).toHaveBeenCalledWith(item);
    expect(mockCreatePost).toHaveBeenCalledWith('team-a', expect.objectContaining({ title: 'We shipped v2' }));
  });
});

describe('R7: on failure', () => {
  it('keeps the form open with the text, and shows the service error', async () => {
    mockCreatePost.mockRejectedValue(new Error('Failed to post team news'));
    const { onPosted } = renderPostNews();
    fireEvent.click(postButton()!);
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to post team news'));
    expect(screen.getByRole('heading', { name: 'Post news' })).toBeInTheDocument();
    expect(screen.getByLabelText('Headline')).toHaveValue('We shipped v2');
    expect(screen.getByLabelText('Link')).toHaveValue('https://example.com/v2');
    expect(screen.getByRole('button', { name: 'Post' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    expect(onPosted).not.toHaveBeenCalled();
    expect(mockSubmitted).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('a duplicate link shows on the Link field, as on the team page, with no toast', async () => {
    mockCreatePost.mockRejectedValue(new Error('Already in team news: "Old launch" (Nov 2)'));
    renderPostNews();
    fireEvent.click(postButton()!);
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    expect(await screen.findByText('Already in team news: "Old launch" (Nov 2)')).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Headline')).toHaveValue('We shipped v2');
  });
});

describe('R9: events with source home', () => {
  it('sends team-news-create-clicked on the press and team-news-create-post-submitted on the post', async () => {
    mockCreatePost.mockResolvedValue(created('team-a', 'Alpha Labs'));
    renderPostNews();
    fireEvent.click(postButton()!);
    expect(mockCreateClicked).toHaveBeenCalledWith('team-a', 'Alpha Labs', 'home');
    expect(mockSubmitted).not.toHaveBeenCalled();

    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));
    await waitFor(() => expect(mockSubmitted).toHaveBeenCalledWith('team-a', 'Alpha Labs', 'home'));
  });
});
