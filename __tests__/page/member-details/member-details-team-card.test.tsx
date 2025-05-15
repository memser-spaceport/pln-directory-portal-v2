import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberDetailsTeamCard from '@/components/page/member-details/member-details-team-card';

// Mocks
const analyticsMock = {
  onTeamClicked: jest.fn(),
};
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => analyticsMock,
}));
jest.mock('@/components/core/tooltip/tooltip', () => ({
  Tooltip: ({ trigger, content }: any) => (
    <>{trigger}{content && <span data-testid="tooltip-content">{content}</span>}</>
  ),
}));
jest.mock('@/components/ui/tag', () => ({
  Tag: ({ value }: any) => <span data-testid="tag">{value}</span>,
}));

const baseTeam = {
  id: 't1',
  name: 'Team One',
  logo: '/logo.png',
};
const baseUserInfo = { uid: '1', name: 'User', email: 'user@email.com', roles: ['admin'] };
const baseMember = { id: 'm1', name: 'Member' };
const baseTags = [
  { title: 'Tag1' },
  { title: 'Tag2' },
  { title: 'Tag3' },
];

/**
 * Test suite for MemberDetailsTeamCard component.
 * Covers all branches, edge cases, and user interactions.
 */
describe('MemberDetailsTeamCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders team name, logo, and role', () => {
    render(
      <MemberDetailsTeamCard
        team={baseTeam as any}
        isLoggedIn={true}
        role="Developer"
        tags={baseTags}
        isMainTeam={false}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
      />
    );
    expect(screen.getByText('Team One')).toBeInTheDocument();
    expect(screen.getByAltText('profile')).toHaveAttribute('src', '/logo.png');
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('renders default logo if team logo is missing', () => {
    render(
      <MemberDetailsTeamCard
        team={{ ...baseTeam, logo: undefined } as any}
        isLoggedIn={true}
        role="Developer"
        tags={baseTags}
        isMainTeam={false}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
      />
    );
    expect(screen.getByAltText('profile')).toHaveAttribute('src', '/icons/team-default-profile.svg');
  });

  it('renders main team badge and tooltip', () => {
    render(
      <MemberDetailsTeamCard
        team={baseTeam as any}
        isLoggedIn={true}
        role="Developer"
        tags={baseTags}
        isMainTeam={true}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
      />
    );
    expect(screen.getByAltText('Main Team')).toBeInTheDocument();
    expect(screen.getAllByTestId('tooltip-content').some(el => el.textContent === 'Main Team')).toBe(true);
  });

  it('renders up to 2 tag tooltips and a +N tag for more', () => {
    render(
      <MemberDetailsTeamCard
        team={baseTeam as any}
        isLoggedIn={true}
        role="Developer"
        tags={baseTags}
        isMainTeam={false}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
      />
    );
    // Only the first 2 tag tooltips
    const tagTooltips = screen.getAllByTestId('tooltip-content').filter(el => baseTags.map(t => t.title).includes(el.textContent!));
    expect(tagTooltips.length).toBe(2);
    // +N tag for more
    const plusTag = screen.getAllByTestId('tag').find(tag => tag.textContent === '+1');
    expect(plusTag).toBeTruthy();
  });

  it('renders all tags if 2 or fewer', () => {
    render(
      <MemberDetailsTeamCard
        team={baseTeam as any}
        isLoggedIn={true}
        role="Developer"
        tags={[{ title: 'Tag1' }, { title: 'Tag2' }]}
        isMainTeam={false}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
      />
    );
    expect(screen.getAllByTestId('tag').length).toBe(2);
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });

  it('renders no tags gracefully', () => {
    render(
      <MemberDetailsTeamCard
        team={baseTeam as any}
        isLoggedIn={true}
        role="Developer"
        tags={[]}
        isMainTeam={false}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
      />
    );
    expect(screen.queryByTestId('tag')).not.toBeInTheDocument();
  });

  it('calls analytics on team card click', () => {
    render(
      <MemberDetailsTeamCard
        team={baseTeam as any}
        isLoggedIn={true}
        role="Developer"
        tags={baseTags}
        isMainTeam={false}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
      />
    );
    fireEvent.click(screen.getByRole('link'));
    expect(analyticsMock.onTeamClicked).toHaveBeenCalled();
  });

  it('renders with missing team, role, tags, and isMainTeam', () => {
    render(
      <MemberDetailsTeamCard
        team={undefined}
        isLoggedIn={true}
        role={undefined}
        tags={undefined}
        isMainTeam={undefined}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
      />
    );
    expect(screen.getByAltText('profile')).toHaveAttribute('src', '/icons/team-default-profile.svg');
    // Both name and role <p> should be empty
    const emptyPs = screen.getAllByText('');
    expect(emptyPs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders correctly with only one tag', () => {
    render(
      <MemberDetailsTeamCard
        team={baseTeam as any}
        isLoggedIn={true}
        role="Developer"
        tags={[{ title: 'Tag1' }]}
        isMainTeam={false}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
      />
    );
    expect(screen.getAllByTestId('tag').length).toBe(1);
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });

  it('renders with isPopupOpen true', () => {
    render(
      <MemberDetailsTeamCard
        team={baseTeam as any}
        isLoggedIn={true}
        role="Developer"
        tags={baseTags}
        isMainTeam={false}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
        isPopupOpen={true}
      />
    );
    expect(screen.getByText('Team One')).toBeInTheDocument();
  });

  it('renders with isPopupOpen false', () => {
    render(
      <MemberDetailsTeamCard
        team={baseTeam as any}
        isLoggedIn={true}
        role="Developer"
        tags={baseTags}
        isMainTeam={false}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
        isPopupOpen={false}
      />
    );
    expect(screen.getByText('Team One')).toBeInTheDocument();
  });

  it('renders with isPopupOpen undefined (default)', () => {
    render(
      <MemberDetailsTeamCard
        team={baseTeam as any}
        isLoggedIn={true}
        role="Developer"
        tags={baseTags}
        isMainTeam={false}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
      />
    );
    expect(screen.getByText('Team One')).toBeInTheDocument();
  });

  it('shows tooltip for extra tags when +N tag is clicked', () => {
    render(
      <MemberDetailsTeamCard
        team={baseTeam as any}
        isLoggedIn={true}
        role="Developer"
        tags={baseTags}
        isMainTeam={false}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
      />
    );
    const plusTag = screen.getAllByTestId('tag').find(tag => tag.textContent === '+1');
    expect(plusTag).toBeTruthy();
    fireEvent.click(plusTag!);
    // The tooltip content for the extra tag should be present
    expect(screen.getAllByTestId('tooltip-content').some(el => el.textContent?.includes('Tag3'))).toBe(true);
  });

  it('renders extra tags with comma in tooltip when more than one extra tag', () => {
    const fourTags = [
      { title: 'Tag1' },
      { title: 'Tag2' },
      { title: 'Tag3' },
      { title: 'Tag4' },
    ];
    render(
      <MemberDetailsTeamCard
        team={baseTeam as any}
        isLoggedIn={true}
        role="Developer"
        tags={fourTags}
        isMainTeam={false}
        url="/team"
        userInfo={baseUserInfo as any}
        member={baseMember as any}
      />
    );
    const plusTag = screen.getAllByTestId('tag').find(tag => tag.textContent === '+2');
    expect(plusTag).toBeTruthy();
    fireEvent.click(plusTag!);
    // The tooltip content for the extra tags should include both Tag3 and Tag4, and a comma
    const tooltipContents = screen.getAllByTestId('tooltip-content');
    expect(tooltipContents.some(el => el.textContent?.includes('Tag3'))).toBe(true);
    expect(tooltipContents.some(el => el.textContent?.includes('Tag4'))).toBe(true);
    expect(tooltipContents.some(el => el.textContent?.includes(','))).toBe(true);
  });
}); 