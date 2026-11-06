import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { recordMemberSignal } from '@/services/member-signals/member-signals.service';
import { MemberSignalViewTracker } from '@/components/core/MemberSignalViewTracker';
import Hyperlinks from '@/components/page/project-details/hyper-links';
import { TeamContactInfoView } from '@/components/page/team-details/TeamContactInfo/components/TeamContactInfoView';
import { ContactDetails } from '@/components/page/member-details/contact-details/ContactDetails';
import { SearchResultsItem } from '@/components/core/application-search/components/SearchResultsSection/components/SearchResultsItem';
import { useCurrentUserStore } from '@/services/auth/store';
import type { IMember } from '@/types/members.types';
import type { ITeam } from '@/types/teams.types';
import type { IUserInfo } from '@/types/shared.types';

jest.mock('@/services/member-signals/member-signals.service', () => ({
  ...jest.requireActual('@/services/member-signals/member-signals.service'),
  recordMemberSignal: jest.fn(),
}));

const projectContactClicked = jest.fn();
const teamContactClicked = jest.fn();
const socialLinkClicked = jest.fn();
const searchResultClicked = jest.fn();
jest.mock('@/analytics/project.analytics', () => ({
  useProjectAnalytics: () => ({ onProjectDetailContactClicked: projectContactClicked }),
}));
jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: () => ({ onTeamDetailContactClicked: teamContactClicked }),
}));
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({ onSocialProfileLinkClicked: socialLinkClicked, onEditContactDetailsClicked: jest.fn() }),
}));
jest.mock('@/analytics/auth.analytics', () => ({ useAuthAnalytics: () => ({ onLoginBtnClicked: jest.fn() }) }));
jest.mock('@/components/core/login/utils', () => ({ useLoginRedirect: () => jest.fn() }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }));
jest.mock('@/analytics/unified-search.analytics', () => ({
  useUnifiedSearchAnalytics: () => ({ onSearchResultClick: searchResultClicked }),
}));

const mockRecord = recordMemberSignal as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('member signal call sites (LAB-3123)', () => {
  it('the view tracker renders nothing and records one view per mount', () => {
    const { container, rerender } = render(<MemberSignalViewTracker entityType="team" entityId="team-1" />);
    rerender(<MemberSignalViewTracker entityType="team" entityId="team-1" />);

    expect(container).toBeEmptyDOMElement();
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockRecord).toHaveBeenCalledWith({ action: 'view', entityType: 'team', entityId: 'team-1' });
  });

  it('a project link click keeps its analytics event and adds a project-link-click', () => {
    render(<Hyperlinks project={{ id: 'p1', projectLinks: [{ url: 'https://x.io', name: 'Site' }] }} user={{}} />);

    fireEvent.click(screen.getByText('Site'));

    expect(projectContactClicked).toHaveBeenCalled();
    expect(mockRecord).toHaveBeenCalledWith({ action: 'project-link-click', entityType: 'project', entityId: 'p1' });
  });

  it('a team contact click keeps its analytics event and adds a team-contact-click', () => {
    const team = {
      id: 'team-1',
      asks: [],
      maintainingProjects: [],
      contributingProjects: [],
      teamFocusAreas: [],
      contactMethod: 'hello@acme.com',
    } as unknown as ITeam;
    const { container } = render(
      <TeamContactInfoView team={team} userInfo={{ uid: 'u2', leadingTeams: [] }} toggleIsEditMode={jest.fn()} />,
    );

    const link = container.querySelector('a[href]') as HTMLElement;
    expect(link).not.toBeNull();
    fireEvent.click(link);

    expect(teamContactClicked).toHaveBeenCalled();
    expect(mockRecord).toHaveBeenCalledWith({ action: 'team-contact-click', entityType: 'team', entityId: 'team-1' });
  });

  it('member contact details: a link click adds contact-click, a copy adds contact-copy', () => {
    useCurrentUserStore.setState({
      currentUser: { uid: 'viewer', rbac: { status: 'APPROVED', effectivePermissions: [] } } as unknown as IUserInfo,
    });
    const member = {
      id: 'member-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      linkedinHandle: 'ada',
      visibleHandles: ['email', 'linkedin'],
    } as unknown as IMember;
    const { container } = render(
      <ContactDetails member={member} isLoggedIn userInfo={{} as IUserInfo} onEdit={jest.fn()} />,
    );

    const link = container.querySelector('a.profile-social-link') as HTMLElement;
    fireEvent.click(link);
    expect(socialLinkClicked).toHaveBeenCalled();
    expect(mockRecord).toHaveBeenCalledWith({ action: 'contact-click', entityType: 'member', entityId: 'member-1' });

    fireEvent.copy(link);
    expect(mockRecord).toHaveBeenCalledWith({ action: 'contact-copy', entityType: 'member', entityId: 'member-1' });
  });

  it('a search result click on a team adds search-result-click; an event result adds nothing', () => {
    const item = (index: string) => ({ uid: `${index}-1`, name: `${index} result`, index, matches: [] }) as any;
    const { unmount } = render(
      <ul>
        <SearchResultsItem item={item('teams')} />
      </ul>,
    );
    fireEvent.click(screen.getByText('teams result'));
    expect(searchResultClicked).toHaveBeenCalled();
    expect(mockRecord).toHaveBeenCalledWith({ action: 'search-result-click', entityType: 'team', entityId: 'teams-1' });
    unmount();
    mockRecord.mockClear();

    render(
      <ul>
        <SearchResultsItem item={{ ...item('events'), source: { eventUrl: 'https://e.io' } }} />
      </ul>,
    );
    fireEvent.click(screen.getByText('events result'));
    expect(mockRecord).not.toHaveBeenCalled();
  });
});
