import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { JobSearchStatusDetails } from '@/components/page/member-details/JobSearchStatusDetails/JobSearchStatusDetails';
import { useCurrentUserStore } from '@/services/auth/store';
import { toast } from '@/components/core/ToastContainer';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

/* The hook module, NOT `useMutation`. jest.setup.js mocks `useMutation` to
   return a FRESH `jest.fn()` on every call, so a test that lets the real hook
   through can never reach the `mutate` the component is holding — the
   assertions pass vacuously against a different function. Same reason
   job-profile-drawer-footer.test.tsx mocks at this level. */
const mutate = jest.fn();
jest.mock('@/services/members/hooks/useUpdateMemberParams', () => ({
  useUpdateMemberParams: () => ({ mutate, isPending: false }),
}));

const onJobSearchStatusChanged = jest.fn();
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({ onJobSearchStatusChanged }),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { error: jest.fn() },
}));

const MEMBER_UID = 'member-1';

const makeMember = (jobSearchStatus?: string | null) =>
  ({ id: MEMBER_UID, name: 'Ada Lovelace', jobSearchStatus }) as unknown as IMember;

function seedViewer(uid: string | null) {
  useCurrentUserStore.setState({
    currentUser: uid ? ({ uid, rbac: { status: 'APPROVED', effectivePermissions: [] } } as unknown as IUserInfo) : null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  seedViewer(MEMBER_UID);
});

describe('JobSearchStatusDetails', () => {
  it('offers all three options to the member, including "Not looking"', () => {
    render(<JobSearchStatusDetails member={makeMember(null)} />);

    /* The point of the assertion is the third one. The apply drawer shows two
       — it hides "Not looking" mid-application — and this card deliberately
       diverges, because it is the only surface where a member can stop being
       surfaced to founders. A future reader "restoring consistency" with the
       drawer breaks the one thing this card was added for, so the divergence is
       pinned by a test and not only by a comment. */
    expect(screen.getByText('Actively looking')).toBeInTheDocument();
    expect(screen.getByText('Open to the right role')).toBeInTheDocument();
    expect(screen.getByText('Not looking')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('renders the stored status as the checked option', () => {
    render(<JobSearchStatusDetails member={makeMember('open-to-right-role')} />);

    expect(screen.getByRole('radio', { name: /Open to the right role/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Actively looking/ })).not.toBeChecked();
  });

  it('leaves every option unchecked when the status is unanswered', () => {
    render(<JobSearchStatusDetails member={makeMember(null)} />);

    screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeChecked());
  });

  it('treats an unrecognised wire value as unanswered rather than crashing', () => {
    render(<JobSearchStatusDetails member={makeMember('taking-a-sabbatical')} />);

    screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeChecked());
  });

  it('renders nothing when the viewer is not the member', () => {
    seedViewer('someone-else');
    const { container } = render(<JobSearchStatusDetails member={makeMember('actively-looking')} />);

    /* The privacy promise, asserted rather than assumed. The page gates this on
       `isOwner` too; this covers the case where some other host forgets to. */
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Job search status')).not.toBeInTheDocument();
  });

  it('renders nothing for a logged-out viewer', () => {
    seedViewer(null);
    const { container } = render(<JobSearchStatusDetails member={makeMember('actively-looking')} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('patches only the job search status, and fires the event without the answer in it', async () => {
    const user = userEvent.setup();
    render(<JobSearchStatusDetails member={makeMember('actively-looking')} />);

    await user.click(screen.getByRole('radio', { name: /Not looking/ }));

    /* Exactly one field. Reaching for buildMemberUpdatePayload here would post
       the whole member record back from a card that asked one question. */
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({
      uid: MEMBER_UID,
      payload: { jobSearchStatus: 'not-looking' },
    });

    /* The status is private, so it must not travel in analytics — the event
       counts the act only. */
    expect(onJobSearchStatusChanged).toHaveBeenCalledWith({ source: 'member-profile' });
    expect(JSON.stringify(onJobSearchStatusChanged.mock.calls[0][0])).not.toContain('not-looking');
  });

  it('tells the member when the save fails', async () => {
    const user = userEvent.setup();
    render(<JobSearchStatusDetails member={makeMember(null)} />);

    await user.click(screen.getByRole('radio', { name: /Actively looking/ }));

    /* The write is optimistic: the dot moves and then un-moves on its own, so
       without this the failure is not merely silent, it is misleading. */
    mutate.mock.calls[0][1].onError();
    expect(toast.error).toHaveBeenCalledWith("Couldn't save your job search status. Please try again.");
  });

  it('marks the section as visible only to the member', () => {
    render(<JobSearchStatusDetails member={makeMember(null)} />);

    expect(screen.getByText('Job search status')).toBeInTheDocument();
    expect(screen.getByText(/Only visible to you/i)).toBeInTheDocument();
  });
});
