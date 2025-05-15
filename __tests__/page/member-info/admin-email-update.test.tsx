import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminEmailUpdate from '../../../components/page/member-info/admin-email-update';

// --- Mocks ---
const recordMemberEmailAdminEditClick = jest.fn();
const recordMemberEmailAdminEditCancel = jest.fn();
jest.mock('@/analytics/settings.analytics', () => ({
  useSettingsAnalytics: () => ({
    recordMemberEmailAdminEditClick,
    recordMemberEmailAdminEditCancel,
  }),
}));
jest.mock('@/utils/third-party.helper', () => ({
  getUserInfo: () => ({ id: 'user-1', email: 'admin@site.com' }),
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => ({ id: 'user-1' })),
}));

describe('AdminEmailUpdate', () => {
  const baseEmail = 'test@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders in view mode by default', () => {
    render(<AdminEmailUpdate email={baseEmail} />);
    expect(screen.getByText('Email*')).toBeInTheDocument();
    expect(screen.getByText(baseEmail)).toBeInTheDocument();
    expect(screen.getByText('Edit Email')).toBeInTheDocument();
    expect(screen.queryByText('Enter New Email*')).not.toBeInTheDocument();
  });

  it('switches to edit mode when Edit Email is clicked and tracks analytics', () => {
    render(<AdminEmailUpdate email={baseEmail} />);
    fireEvent.click(screen.getByText('Edit Email'));
    expect(screen.getByText('Enter New Email*')).toBeInTheDocument();
    expect(recordMemberEmailAdminEditClick).toHaveBeenCalledWith(baseEmail, { id: 'user-1' });
  });

  it('shows error if emails do not match', () => {
    render(<AdminEmailUpdate email={baseEmail} />);
    fireEvent.click(screen.getByText('Edit Email'));
    const newEmailInput = screen.getAllByPlaceholderText('Enter new email')[0];
    const confirmEmailInput = screen.getAllByPlaceholderText('Confirm new email')[0];
    fireEvent.change(newEmailInput, { target: { value: 'a@b.com' } });
    fireEvent.change(confirmEmailInput, { target: { value: 'b@b.com' } });
    expect(screen.getByText('Emails do not match.')).toBeInTheDocument();
  });

  it('clears error if emails match', () => {
    render(<AdminEmailUpdate email={baseEmail} />);
    fireEvent.click(screen.getByText('Edit Email'));
    const newEmailInput = screen.getAllByPlaceholderText('Enter new email')[0];
    const confirmEmailInput = screen.getAllByPlaceholderText('Confirm new email')[0];
    fireEvent.change(newEmailInput, { target: { value: 'a@b.com' } });
    fireEvent.change(confirmEmailInput, { target: { value: 'a@b.com' } });
    expect(screen.queryByText('Emails do not match.')).not.toBeInTheDocument();
  });

  it('prevents pasting into confirm email input', () => {
    render(<AdminEmailUpdate email={baseEmail} />);
    fireEvent.click(screen.getByText('Edit Email'));
    const confirmEmailInput = screen.getAllByPlaceholderText('Confirm new email')[0];
    const pasteEvent = new Event('paste', { bubbles: true });
    Object.assign(pasteEvent, { preventDefault: jest.fn() });
    fireEvent(confirmEmailInput, pasteEvent);
    expect(pasteEvent.preventDefault).toHaveBeenCalled();
  });

  it('cancels edit and resets state when Cancel is clicked', () => {
    render(<AdminEmailUpdate email={baseEmail} />);
    fireEvent.click(screen.getByText('Edit Email'));
    const newEmailInput = screen.getAllByPlaceholderText('Enter new email')[0];
    const confirmEmailInput = screen.getAllByPlaceholderText('Confirm new email')[0];
    fireEvent.change(newEmailInput, { target: { value: 'a@b.com' } });
    fireEvent.change(confirmEmailInput, { target: { value: 'b@b.com' } });
    expect(screen.getByText('Emails do not match.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(recordMemberEmailAdminEditCancel).toHaveBeenCalledWith(baseEmail, { id: 'user-1' });
    expect(screen.getByText('Edit Email')).toBeInTheDocument();
    expect(screen.queryByText('Emails do not match.')).not.toBeInTheDocument();
  });

  it('resets to view mode if email prop changes', () => {
    const { rerender } = render(<AdminEmailUpdate email={baseEmail} />);
    fireEvent.click(screen.getByText('Edit Email'));
    expect(screen.getByText('Enter New Email*')).toBeInTheDocument();
    rerender(<AdminEmailUpdate email={'new@email.com'} />);
    expect(screen.getByText('Edit Email')).toBeInTheDocument();
    expect(screen.queryByText('Enter New Email*')).not.toBeInTheDocument();
  });

  it('clears error if one or both email fields are empty', () => {
    render(<AdminEmailUpdate email={baseEmail} />);
    fireEvent.click(screen.getByText('Edit Email'));
    const newEmailInput = screen.getAllByPlaceholderText('Enter new email')[0];
    const confirmEmailInput = screen.getAllByPlaceholderText('Confirm new email')[0];

    // Only new email filled
    fireEvent.change(newEmailInput, { target: { value: 'a@b.com' } });
    fireEvent.change(confirmEmailInput, { target: { value: '' } });
    expect(screen.queryByText('Emails do not match.')).not.toBeInTheDocument();

    // Only confirm email filled
    fireEvent.change(newEmailInput, { target: { value: '' } });
    fireEvent.change(confirmEmailInput, { target: { value: 'a@b.com' } });
    expect(screen.queryByText('Emails do not match.')).not.toBeInTheDocument();

    // Both empty
    fireEvent.change(newEmailInput, { target: { value: '' } });
    fireEvent.change(confirmEmailInput, { target: { value: '' } });
    expect(screen.queryByText('Emails do not match.')).not.toBeInTheDocument();
  });

  it('sets the hidden input value to empty string when emails do not match or are empty', () => {
    render(<AdminEmailUpdate email={baseEmail} />);
    fireEvent.click(screen.getByText('Edit Email'));
    const newEmailInput = screen.getAllByPlaceholderText('Enter new email')[0];
    const confirmEmailInput = screen.getAllByPlaceholderText('Confirm new email')[0];

    // Not matching
    fireEvent.change(newEmailInput, { target: { value: 'a@b.com' } });
    fireEvent.change(confirmEmailInput, { target: { value: 'b@b.com' } });
    let hiddenInput = screen.getByTestId('hidden-email-input');
    expect(hiddenInput).toHaveAttribute('value', '');

    // Both empty
    fireEvent.change(newEmailInput, { target: { value: '' } });
    fireEvent.change(confirmEmailInput, { target: { value: '' } });
    hiddenInput = screen.getByTestId('hidden-email-input');
    expect(hiddenInput).toHaveAttribute('value', '');
  });
}); 