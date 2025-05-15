import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllRepositories from '@/components/page/member-details/all-repositories';

// Mock MemberDetailsRepoCard to just render repo name for simplicity
jest.mock('@/components/page/member-details/member-details-repo-card', () => ({
  __esModule: true,
  default: ({ repo }: any) => <div data-testid="repo-card">{repo.name}</div>,
}));

const baseRepos = [
  { name: 'Repo1' },
  { name: 'Repo2' },
  { name: 'TestRepo' },
];
const baseUserInfo = { uid: '1', name: 'User', email: 'user@email.com', roles: ['admin'] };
const baseMember = { id: 'm1', name: 'Member' };

/**
 * Test suite for AllRepositories component.
 * Covers all branches, edge cases, and user interactions.
 */
describe('AllRepositories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders repository list and count', () => {
    render(
      <AllRepositories allRepos={baseRepos} userInfo={baseUserInfo} member={baseMember} />
    );
    expect(screen.getByText('Repositories')).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument();
    expect(screen.getAllByTestId('repo-card').length).toBe(3);
  });

  it('filters repositories by search term', () => {
    render(
      <AllRepositories allRepos={baseRepos} userInfo={baseUserInfo} member={baseMember} />
    );
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'Test' } });
    expect(screen.getAllByTestId('repo-card').length).toBe(1);
    expect(screen.getByText('TestRepo')).toBeInTheDocument();
  });

  it('shows empty state if no repositories match search', () => {
    render(
      <AllRepositories allRepos={baseRepos} userInfo={baseUserInfo} member={baseMember} />
    );
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'NoMatch' } });
    expect(screen.queryByTestId('repo-card')).not.toBeInTheDocument();
    expect(screen.getByText('No repository found.')).toBeInTheDocument();
  });

  it('shows empty state if allRepos is empty', () => {
    render(
      <AllRepositories allRepos={[]} userInfo={baseUserInfo} member={baseMember} />
    );
    expect(screen.getByText('No repository found.')).toBeInTheDocument();
  });

  it('shows empty state if allRepos is undefined', () => {
    render(
      <AllRepositories allRepos={undefined} userInfo={baseUserInfo} member={baseMember} />
    );
    expect(screen.getByText('No repository found.')).toBeInTheDocument();
  });

  it('handles allRepos as undefined gracefully', () => {
    render(
      <AllRepositories allRepos={undefined} userInfo={baseUserInfo} member={baseMember} />
    );
    expect(screen.getByText('No repository found.')).toBeInTheDocument();
  });

  it('handles allRepos as null gracefully', () => {
    render(
      <AllRepositories allRepos={null} userInfo={baseUserInfo} member={baseMember} />
    );
    expect(screen.getByText('No repository found.')).toBeInTheDocument();
  });

  it('resets search and repo list on close-member-repos-modal event', async () => {
    render(
      <AllRepositories allRepos={baseRepos} userInfo={baseUserInfo} member={baseMember} />
    );
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'Test' } });
    expect(screen.getByText('TestRepo')).toBeInTheDocument();
    // Dispatch the event
    document.dispatchEvent(new Event('close-member-repos-modal'));
    // Should reset search and show all repos
    await waitFor(() => expect(input).toHaveValue(''));
    expect(screen.getAllByTestId('repo-card').length).toBe(3);
  });

  it('resets repo list when search input is cleared', () => {
    render(
      <AllRepositories allRepos={baseRepos} userInfo={baseUserInfo} member={baseMember} />
    );
    const input = screen.getByPlaceholderText('Search');
    // Type a search term to filter
    fireEvent.change(input, { target: { value: 'Test' } });
    expect(screen.getAllByTestId('repo-card').length).toBe(1);
    // Clear the input
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getAllByTestId('repo-card').length).toBe(3);
  });

  it('handles missing allRepos prop gracefully', () => {
    // @ts-expect-error: intentionally omitting allRepos
    render(<AllRepositories userInfo={baseUserInfo} member={baseMember} />);
    expect(screen.getByText('No repository found.')).toBeInTheDocument();
  });

  it('throws if allRepos is not an array, undefined, or null', () => {
    expect(() =>
      render(<AllRepositories allRepos={42} userInfo={baseUserInfo} member={baseMember} />)
    ).toThrow();
  });
}); 