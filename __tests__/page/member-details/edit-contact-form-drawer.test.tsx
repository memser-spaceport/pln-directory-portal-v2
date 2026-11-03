import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EditContactForm } from '@/components/page/member-details/ContactDetails/components/EditContactForm';
import { ContactDetails } from '@/components/page/member-details/contact-details/ContactDetails';
import { useCurrentUserStore } from '@/services/auth/store';
import { validateSocialField } from '@/utils/profile/validateSocialField';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

const mockUpdateMember = jest.fn();
const mockRefresh = jest.fn();
const mockUpdatePreferences = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), refresh: mockRefresh }),
  usePathname: () => '/jobs',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('@/services/members/hooks/useUpdateMember', () => ({
  useUpdateMember: () => ({ mutateAsync: mockUpdateMember }),
}));
jest.mock('@/services/members/hooks/useUpdateMemberPreferences', () => ({
  useUpdateMemberPreferences: () => ({ mutateAsync: mockUpdatePreferences }),
}));
jest.mock('@/services/members/hooks/useUpdateEmail', () => ({
  useUpdateEmail: () => ({ requestEmailChange: jest.fn() }),
}));
jest.mock('@/services/members/hooks/useMember', () => ({
  useMember: () => ({
    data: { memberInfo: { uid: 'member-1', name: 'Ada Lovelace', email: 'ada@example.com', imageUid: 'img-1' } },
  }),
}));
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({ onSaveContactDetailsClicked: jest.fn(), onSocialProfileLinkClicked: jest.fn() }),
}));
jest.mock('@/analytics/auth.analytics', () => ({
  useAuthAnalytics: () => ({ onLoginBtnClicked: jest.fn() }),
}));
jest.mock('@/components/core/login/utils', () => ({
  useLoginRedirect: () => jest.fn(),
}));

const GITHUB_PLACEHOLDER = 'eg., username or https://github.com/username';

const baseMember = {
  id: 'member-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  linkedinHandle: 'ada-lovelace',
  telegramHandle: 'ada',
  twitter: 'ada',
  discordHandle: 'ada#1234',
  githubHandle: null,
  preferences: undefined,
  visibleHandles: [],
} as unknown as IMember;

const userInfo = { uid: 'member-1', name: 'Ada Lovelace', email: 'ada@example.com' } as unknown as IUserInfo;

function renderDrawerForm(member: IMember = baseMember) {
  const onClose = jest.fn();
  render(<EditContactForm onClose={onClose} member={member} userInfo={userInfo} variant="drawer" />);

  return { onClose };
}

/* The job-board profile drawer (Update profile, and the Apply step "Complete
   your profile") renders Contact Details with variant="drawer". LAB-3081: the
   drawer form had no GitHub field, so a job-board member could not add GitHub
   and the Repositories section never filled. */
describe('EditContactForm, drawer variant (LAB-3081)', () => {
  beforeEach(() => {
    mockUpdateMember.mockReset().mockResolvedValue({ isError: false });
    mockUpdatePreferences.mockReset().mockResolvedValue({ isError: false });
  });

  it('shows the GitHub field with the same label and placeholder as the default variant', () => {
    renderDrawerForm();

    expect(screen.getByPlaceholderText(GITHUB_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText('Github')).toBeInTheDocument();
    expect(screen.getByAltText('Github')).toBeInTheDocument();
  });

  it('keeps Discord and the sharing switch hidden in the drawer', () => {
    renderDrawerForm();

    expect(screen.queryByText('Discord')).not.toBeInTheDocument();
    expect(screen.queryByText('Show contact details to PL network members')).not.toBeInTheDocument();
  });

  it('prefills the saved GitHub handle', () => {
    renderDrawerForm({ ...baseMember, githubHandle: 'octocat' } as unknown as IMember);

    expect(screen.getByPlaceholderText(GITHUB_PLACEHOLDER)).toHaveValue('octocat');
  });

  it('sends the bare handle as githubHandler and keeps Discord and the sharing preferences', async () => {
    const { onClose } = renderDrawerForm();

    fireEvent.change(screen.getByPlaceholderText(GITHUB_PLACEHOLDER), {
      target: { value: 'https://github.com/octocat' },
    });
    fireEvent.submit(screen.getByPlaceholderText(GITHUB_PLACEHOLDER).closest('form')!);

    await waitFor(() => expect(mockUpdateMember).toHaveBeenCalledTimes(1));

    const { payload } = mockUpdateMember.mock.calls[0][0];
    expect(payload.newData.githubHandler).toBe('octocat');
    expect(payload.newData.discordHandler).toBe('ada#1234');

    const prefs = mockUpdatePreferences.mock.calls[0][0].payload;
    expect(prefs.github).toBe(true);
    expect(prefs.githubProjects).toBe(true);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('shows the GitHub validation message for an invalid value and sends nothing', async () => {
    renderDrawerForm();
    const invalid = 'https://gitlab.com/octocat';
    const expected = validateSocialField('github', invalid);
    expect(expected).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText(GITHUB_PLACEHOLDER), { target: { value: invalid } });
    fireEvent.submit(screen.getByPlaceholderText(GITHUB_PLACEHOLDER).closest('form')!);

    expect(await screen.findByText(expected!)).toBeInTheDocument();
    expect(mockUpdateMember).not.toHaveBeenCalled();
  });
});

describe('ContactDetails view, drawer variant (LAB-3081)', () => {
  beforeEach(() => {
    useCurrentUserStore.setState({
      currentUser: { uid: 'member-1', rbac: { status: 'PENDING', effectivePermissions: [] } } as unknown as IUserInfo,
    });
  });

  it('lists the saved GitHub handle', () => {
    const { container } = render(
      <ContactDetails
        member={{ ...baseMember, githubHandle: 'octocat' } as unknown as IMember}
        isLoggedIn
        userInfo={userInfo}
        onEdit={jest.fn()}
        variant="drawer"
      />,
    );

    expect(container.querySelector('a[href*="github.com/octocat"]')).toBeInTheDocument();
  });
});
