import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/components/core/mcp-hints/McpHint', () => ({
  McpHint: (props: Record<string, unknown>) => <div data-testid="mcp-hint" data-props={JSON.stringify(props)} />,
}));

let mockShowForumHint = true;
jest.mock('@/utils/mcp', () => ({
  ...jest.requireActual('@/utils/mcp'),
  get SHOW_MCP_FORUM_HINT() {
    return mockShowForumHint;
  },
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/form/FormEditor', () => ({
  FormEditor: () => <div data-testid="post-editor" />,
}));
jest.mock('@/components/form/FormSelect', () => ({
  FormSelect: ({ label }: { label: string }) => <div data-testid="select">{label}</div>,
}));
jest.mock('@/services/forum/hooks/useForumCategories', () => ({ useForumCategories: () => ({ data: [] }) }));
jest.mock('@/services/forum/hooks/useCreatePost', () => ({ useCreatePost: () => ({ mutateAsync: jest.fn() }) }));
jest.mock('@/services/forum/hooks/useEditPost', () => ({ useEditPost: () => ({ mutateAsync: jest.fn() }) }));
jest.mock('@/services/members/hooks/useAllMembers', () => ({ useAllMembers: () => ({ data: undefined }) }));
jest.mock('@/services/members/hooks/useGetMemberPreferences', () => ({
  useGetMemberPreferences: () => ({ data: undefined }),
}));
jest.mock('@/services/members/hooks/useUpdateMemberPreferences', () => ({
  useUpdateMemberPreferences: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/services/team-news/hooks/useCreateTeamNewsDiscussionLink', () => ({
  useCreateTeamNewsDiscussionLink: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock('@/analytics/forum.analytics', () => ({ useForumAnalytics: () => new Proxy({}, { get: () => jest.fn() }) }));
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { uid: 'me', name: 'Me' } }),
}));
jest.mock('@/hooks/useUnsavedChangesWarning', () => ({
  __esModule: true,
  default: () => ({ isAttemptingNavigation: false, proceedNavigation: jest.fn(), cancelNavigation: jest.fn() }),
}));
jest.mock('@/hooks/useMobileNavVisibility', () => ({ useMobileNavVisibility: () => {} }));

import { CreatePost } from '@/components/page/forum/CreatePost/CreatePost';

const hintProps = () => JSON.parse(screen.getByTestId('mcp-hint').getAttribute('data-props')!);

beforeEach(() => {
  mockShowForumHint = true;
});

describe('CreatePost: MCP hint (LAB-3033)', () => {
  it('shows no MCP hint while Forum MCP is off, even after a title is typed (LAB-3049)', () => {
    mockShowForumHint = false;
    render(<CreatePost />);
    fireEvent.change(screen.getByPlaceholderText('Enter the title'), {
      target: { value: 'Who is hiring Rust engineers?' },
    });
    expect(screen.queryByTestId('mcp-hint')).not.toBeInTheDocument();
  });

  it('passes the typed title to the forum hint', () => {
    render(<CreatePost />);
    expect(hintProps()).toEqual({ context: 'forum', title: '' });

    fireEvent.change(screen.getByPlaceholderText('Enter the title'), {
      target: { value: 'Who is hiring Rust engineers?' },
    });
    expect(hintProps()).toEqual({ context: 'forum', title: 'Who is hiring Rust engineers?' });
  });

  it('sits between the Title field and the post editor', () => {
    render(<CreatePost />);
    const title = screen.getByPlaceholderText('Enter the title');
    const hint = screen.getByTestId('mcp-hint');
    const editor = screen.getByTestId('post-editor');
    expect(title.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hint.compareDocumentPosition(editor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('is not on the edit form', () => {
    render(
      <CreatePost
        isEdit
        pid={1}
        initialData={{ user: null, topic: { label: 'General', value: '1' }, title: 'Old title', content: 'Body' }}
      />,
    );
    expect(screen.queryByTestId('mcp-hint')).not.toBeInTheDocument();
  });
});
