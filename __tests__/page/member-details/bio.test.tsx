import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Bio from '@/components/page/member-details/bio';

const analyticsMock = {
  onMemberDetailsBioReadMoreClicked: jest.fn(),
  onMemberDetailsBioReadLessClicked: jest.fn(),
  onMemberDetailsBioEditClicked: jest.fn(),
  onMemberDetailsBioEditCancelClicked: jest.fn(),
  onMemberDetailsBioEditSaveClicked: jest.fn(),
  recordBioSave: jest.fn(),
};
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => analyticsMock,
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsMemberInfo: jest.fn(() => ({ id: 'm1', name: 'Test Member' })),
  getAnalyticsUserInfo: jest.fn(() => ({ name: 'User', email: 'user@email.com', roles: ['admin'] })),
  triggerLoader: jest.fn(),
}));
jest.mock('js-cookie', () => ({
  get: jest.fn(() => '"token"'),
}));
jest.mock('text-clipper', () => jest.fn((content, length) => content.length > length ? content.slice(0, length) + '...' : content));
jest.mock('next/image', () => (props: any) => <img {...props} />);
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock('@/services/members.service', () => ({
  updateMemberBio: jest.fn(() => Promise.resolve({ data: {}, isError: false })),
}));
jest.mock('react-toastify', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/components/ui/text-editor', () => (props: any) => (
  <textarea data-testid="text-editor" value={props.text} onChange={e => props.setContent(e.target.value)} />
));
jest.mock('@/utils/constants', () => ({
  ADMIN_ROLE: 'admin',
}));

const baseProps = {
  member: {
    id: 'm1',
    name: 'Test Member',
    bio: 'This is a test bio',
    projectContributions: [],
    email: 'test@email.com',
    skills: [],
  },
  userInfo: {
    uid: 'm1',
    roles: ['admin'],
    name: 'User',
    email: 'user@email.com',
  },
};

describe('Bio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the bio content and edit button for owner/admin', () => {
    render(<Bio {...baseProps} />);
    expect(screen.getByText('Bio')).toBeInTheDocument();
    expect(screen.getByText('This is a test bio')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('does not show edit button for non-owner/non-admin', () => {
    const props = { ...baseProps, userInfo: { ...baseProps.userInfo, uid: 'other', roles: [] } };
    render(<Bio {...props} />);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('shows editor when edit is clicked and can cancel', () => {
    render(<Bio {...baseProps} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByTestId('text-editor')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('text-editor')).not.toBeInTheDocument();
  });

  it('can edit and save bio', async () => {
    render(<Bio {...baseProps} />);
    fireEvent.click(screen.getByText('Edit'));
    const textarea = screen.getByTestId('text-editor');
    fireEvent.change(textarea, { target: { value: 'Updated bio' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.queryByTestId('text-editor')).not.toBeInTheDocument();
      expect(screen.getByText('Updated bio')).toBeInTheDocument();
    });
  });

  it('handles save error and shows toast', async () => {
    const { updateMemberBio } = require('@/services/members.service');
    updateMemberBio.mockResolvedValueOnce({ isError: true, errorData: { message: 'Email already exists. Please try again with different email' } });
    render(<Bio {...baseProps} />);
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(require('react-toastify').toast.error).toHaveBeenCalledWith('Email already exists. Please try again with different email');
    });
  });

  it('handles save error (generic) and shows toast', async () => {
    const { updateMemberBio } = require('@/services/members.service');
    updateMemberBio.mockResolvedValueOnce({ isError: true, errorData: { message: 'Other error' } });
    render(<Bio {...baseProps} />);
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(require('react-toastify').toast.error).toHaveBeenCalledWith('Member updated failed. Something went wrong, please try again later');
    });
  });

  it('handles save exception and shows toast, calls analytics.recordBioSave', async () => {
    const { updateMemberBio } = require('@/services/members.service');
    updateMemberBio.mockImplementationOnce(() => { throw new Error('fail'); });
    render(<Bio {...baseProps} />);
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(require('react-toastify').toast.error).toHaveBeenCalledWith('Member updated failed. Something went wrong, please try again later');
      expect(analyticsMock.recordBioSave).toHaveBeenCalledWith(
        'save-error',
        expect.anything(),
        expect.anything()
      );
    });
  });

  it('shows success toast on save', async () => {
    render(<Bio {...baseProps} />);
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(require('react-toastify').toast.success).toHaveBeenCalledWith('Member updated successfully');
    });
  });

  it('does not attempt to save if auth token is missing', async () => {
    const { get } = require('js-cookie');
    get.mockReturnValueOnce(undefined);
    const { updateMemberBio } = require('@/services/members.service');
    render(<Bio {...baseProps} />);
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(updateMemberBio).not.toHaveBeenCalled();
    });
  });

  it('does not show show more button if bio is exactly 1000 characters', () => {
    const exactBio = 'a'.repeat(1000);
    const props = { ...baseProps, member: { ...baseProps.member, bio: exactBio } };
    render(<Bio {...props} />);
    expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
  });

  it('does not show show more or show less for empty bio', () => {
    const props = { ...baseProps, member: { ...baseProps.member, bio: '' } };
    render(<Bio {...props} />);
    expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show less/i })).not.toBeInTheDocument();
  });

  it('renders short bio without ellipsis', () => {
    const props = { ...baseProps, member: { ...baseProps.member, bio: 'Short bio' } };
    render(<Bio {...props} />);
    expect(screen.getByText('Short bio')).toBeInTheDocument();
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });

  it('renders empty bio without ellipsis', () => {
    const props = { ...baseProps, member: { ...baseProps.member, bio: '' } };
    render(<Bio {...props} />);
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });

  it('resets bio to original on cancel', () => {
    render(<Bio {...baseProps} />);
    fireEvent.click(screen.getByText('Edit'));
    const textarea = screen.getByTestId('text-editor');
    fireEvent.change(textarea, { target: { value: 'Changed bio' } });
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('This is a test bio')).toBeInTheDocument();
  });

  it('shows edit button for owner but not admin', () => {
    const props = { ...baseProps, userInfo: { ...baseProps.userInfo, uid: 'm1', roles: [] } };
    render(<Bio {...props} />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('shows edit button for admin but not owner', () => {
    const props = { ...baseProps, userInfo: { ...baseProps.userInfo, uid: 'other', roles: ['admin'] } };
    render(<Bio {...props} />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('does not show show less button if content is not clipped', () => {
    const props = { ...baseProps, member: { ...baseProps.member, bio: 'Short bio' } };
    render(<Bio {...props} />);
    expect(screen.queryByRole('button', { name: /show less/i })).not.toBeInTheDocument();
  });

  it('clips bio content longer than 1000 characters and shows "show more"', () => {
    const longBio = 'a'.repeat(1200);
    const props = { ...baseProps, member: { ...baseProps.member, bio: longBio } };
    render(<Bio {...props} />);
    // Should show clipped content
    expect(screen.getByText(`${'a'.repeat(1000)}...`)).toBeInTheDocument();
    // Should show "show more" button
    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
  });

  it('expands and collapses bio content with show more/less', () => {
    const longBio = 'a'.repeat(1200);
    const props = { ...baseProps, member: { ...baseProps.member, bio: longBio } };
    render(<Bio {...props} />);
    // Click "show more"
    fireEvent.click(screen.getByRole('button', { name: /show more/i }));
    // Should show full content
    expect(screen.getByText(longBio)).toBeInTheDocument();
    // Should show "show less" button
    fireEvent.click(screen.getByRole('button', { name: /show less/i }));
    // Should show clipped content again
    expect(screen.getByText(`${'a'.repeat(1000)}...`)).toBeInTheDocument();
  });

  it('renders HTML content in bio safely', () => {
    const htmlBio = '<b>Bold Bio</b>';
    const props = { ...baseProps, member: { ...baseProps.member, bio: htmlBio } };
    render(<Bio {...props} />);
    // Should render HTML
    expect(screen.getByText('Bold Bio')).toBeInTheDocument();
  });

  it('calls analytics.recordBioSave on save error (email exists)', async () => {
    const { updateMemberBio } = require('@/services/members.service');
    updateMemberBio.mockResolvedValueOnce({ isError: true, errorData: { message: 'Email already exists. Please try again with different email' } });
    render(<Bio {...baseProps} />);
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(require('react-toastify').toast.error).toHaveBeenCalledWith('Email already exists. Please try again with different email');
      expect(analyticsMock.recordBioSave).toHaveBeenCalledWith(
        'save-error',
        expect.anything(),
        expect.anything()
      );
    });
  });

  it('does not show edit button if user is neither owner nor admin', () => {
    const props = { ...baseProps, userInfo: { uid: 'other', roles: [] } };
    render(<Bio {...props} />);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });
}); 