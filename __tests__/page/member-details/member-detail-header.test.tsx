import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberDetailHeader from '@/components/page/member-details/member-detail-header';
import { useRouter } from 'next/navigation';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { IMember } from '@/types/members.types';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/analytics/members.analytics', () => ({
    useMemberAnalytics: jest.fn(),
}));

jest.mock('@/utils/common.utils', () => ({
    triggerLoader: jest.fn(),
    getAnalyticsMemberInfo: jest.fn(),
    getAnalyticsUserInfo: jest.fn(),
}));

const mockRouter = {
    push: jest.fn(),
};

const mockAnalytics = {
    onMemberEditBySelf: jest.fn(),
    onMemberEditByAdmin: jest.fn(),
};

describe('MemberDetailHeader', () => {
    let member: IMember;
    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useMemberAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
        
            member = {
                id: '1',
                name: 'John Doe',
                profile: '/profile.jpg',
                mainTeam: { role: 'Developer', name: 'Team A' },
                location: {
                    city: '', country: '',
                    metroArea: '',
                    region: '',
                    continent: ''
                },
                teamLead: true,
                openToWork: true,
                skills: [{ title: 'JavaScript' }],
                teams: [{
                    role: 'Developer', name: 'Team A',
                    id: '1',
                    maintainingProjects: [],
                    contributingProjects: [],
                    teamFocusAreas: []
                }],
                officeHours: null,
                projectContributions: [],
                githubHandle: 'githubUser',
                discordHandle: 'discordUser',
                telegramHandle: 'telegramUser',
                twitter: 'twitterUser',
                linkedinHandle: 'linkedinUser',
                email: 'email@example.com',
                preferences: {
                    showEmail: true,
                    showDiscord: true,
                    showTwitter: true,
                    showLinkedin: true,
                    showTelegram: true,
                    showGithubHandle: true,
                    showGithubProjects: true,
                },
            };
    });

    const userInfo = {
        uid: '1',
        roles: ['DIRECTORYADMIN'],
    };

    it('renders member details correctly', () => {
        render(<MemberDetailHeader member={member} userInfo={userInfo} isLoggedIn={true} />);
        expect(screen.getAllByText('John Doe')).toHaveLength(2);
        expect(screen.getAllByText('Developer')).toHaveLength(2);
        expect(screen.getAllByText('Open to Collaborate')).toHaveLength(1);
        expect(screen.getAllByText('Team lead')).toHaveLength(1);
        expect(screen.getAllByText('Team A')).toHaveLength(2);
        expect(screen.getAllByText('JavaScript')).toHaveLength(2);
    });

    it('renders member details correctly null cases', () => {
        member.name = '';
        member.profile = null;
        member.mainTeam = { role: '', name: '' };
        const {container} = render(<MemberDetailHeader member={member} userInfo={userInfo} isLoggedIn={true} />);
        const targetImage = container.querySelector('img[src="/icons/default_profile.svg"]');
    expect(targetImage).toBeInTheDocument();
        expect(screen.getAllByText('Contributor')).toHaveLength(2);
        expect(screen.getAllByText('Open to Collaborate')).toHaveLength(1);
        expect(screen.getAllByText('Team lead')).toHaveLength(1);
        expect(screen.getAllByText('JavaScript')).toHaveLength(2);
    });

    it('renders member team count correctly', () => {
        member.teams= [{
            role: 'Developer', name: 'Team A',
            id: '1',
            maintainingProjects: [],
            contributingProjects: [],
            teamFocusAreas: []
        },{
            role: 'Developer', name: 'Team B',
            id: '11',
            maintainingProjects: [],
            contributingProjects: [],
            teamFocusAreas: []
        }];
        render(<MemberDetailHeader member={member} userInfo={userInfo} isLoggedIn={true} />);
        expect(screen.getAllByText('+1')).toHaveLength(2);
        const test = screen.getAllByText('+1')[0].closest('button')
        if(test){
            fireEvent.click(test);
        }
    });

    it('calls onEditProfileClick when edit button is clicked by owner', () => {
        render(<MemberDetailHeader member={member} userInfo={userInfo} isLoggedIn={true} />);

        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);

        expect(mockAnalytics.onMemberEditBySelf).toHaveBeenCalled();
    });

    it('calls onEditProfileClick when edit button is clicked by admin', () => {
        const adminUserInfo = { ...userInfo, uid: '2' };
        render(<MemberDetailHeader member={member} userInfo={adminUserInfo} isLoggedIn={true} />);

        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);

        expect(mockAnalytics.onMemberEditByAdmin).toHaveBeenCalled();
    });

    it('does not show edit button when user is not logged in', () => {
        render(<MemberDetailHeader member={member} userInfo={userInfo} isLoggedIn={false} />);

        expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
    });

    it('does not show edit button when user is not the owner or admin', () => {
        const otherUserInfo = { ...userInfo, uid: '2',roles: ['USER'] };
        render(<MemberDetailHeader member={member} userInfo={otherUserInfo} isLoggedIn={true} />);

        expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
    });
});