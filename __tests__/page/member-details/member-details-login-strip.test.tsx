import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberProfileLoginStrip from '@/components/page/member-details/member-details-login-strip';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { IMember } from '@/types/members.types';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('js-cookie', () => ({
    get: jest.fn(),
}));

jest.mock('react-toastify', () => ({
    toast: {
        info: jest.fn(),
    },
}));

jest.mock('@/analytics/auth.analytics', () => ({
    useAuthAnalytics: jest.fn(),
}));

describe('MemberProfileLoginStrip', () => {
    const member:IMember = {
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
    };;
    
    const mockRouter = { push: jest.fn(), refresh: jest.fn() };
    const mockAuthAnalytics = { onLoginBtnClicked: jest.fn() };

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useAuthAnalytics as jest.Mock).mockReturnValue(mockAuthAnalytics);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders the component with member name', () => {
        render(<MemberProfileLoginStrip member={member} />);
        expect(screen.getByText("John Doe's")).toBeInTheDocument();
    });

    it('calls router.refresh and shows toast if user is logged in', () => {
        (Cookies.get as jest.Mock).mockReturnValue('userInfo');
        render(<MemberProfileLoginStrip member={member} />);
        fireEvent.click(screen.getByText('Login'));
        expect(toast.info).toHaveBeenCalledWith('You are already logged in');
        expect(mockRouter.refresh).toHaveBeenCalled();
    });

    it('calls authAnalytics and router.push if user is not logged in', () => {
        (Cookies.get as jest.Mock).mockReturnValue(null);
        render(<MemberProfileLoginStrip member={member} />);
        fireEvent.click(screen.getByText('Login'));
        expect(mockAuthAnalytics.onLoginBtnClicked).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith(`${window.location.pathname}${window.location.search}#login`);
    });
});