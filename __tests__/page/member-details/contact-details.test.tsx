import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactDetails from '@/components/page/member-details/contact-details';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

const mockMember: IMember = {
    githubHandle: 'githubUser',
    discordHandle: 'discordUser',
    telegramHandle: 'telegramUser',
    twitter: 'twitterUser',
    linkedinHandle: 'linkedinUser',
    email: 'email@example.com',
    id: '1',
    name: '',
    skills: [{ title: '' }],
    projectContributions: [],
    location: {
        city: '', country: '',
        metroArea: '',
        region: '',
        continent: ''
    },
    officeHours: null,
    teamLead: false,
    teams: [],
    mainTeam: null,
    openToWork: false,
    preferences: {
        showEmail: false,
        showDiscord: false,
        showTwitter: false,
        showLinkedin: false,
        showTelegram: false,
        showGithubHandle: false,
        showGithubProjects: false
    }
};

const mockUserInfo: IUserInfo = {
    name: 'User Name',
};

describe('ContactDetails', () => {
    it('should render contact details title', () => {
        render(<ContactDetails member={mockMember} isLoggedIn={true} userInfo={mockUserInfo} />);
        expect(screen.getByText('Contact Details')).toBeInTheDocument();
    });

    it('should render all social links', () => {
        render(<ContactDetails member={mockMember} isLoggedIn={true} userInfo={mockUserInfo} />);
        expect(screen.queryAllByAltText('linkedin')).toHaveLength(2);
        expect(screen.queryAllByAltText('twitter')).toHaveLength(2);
        expect(screen.queryAllByAltText('discord')).toHaveLength(2);
        expect(screen.queryAllByAltText('telegram')).toHaveLength(2);
        expect(screen.queryAllByAltText('email')).toHaveLength(2);
        expect(screen.queryAllByAltText('github')).toHaveLength(2);
    });

    it('should not render social links if handles are missing', () => {
        const memberWithoutHandles = { ...mockMember, githubHandle: '', discordHandle: '', telegramHandle: '', twitter: '', linkedinHandle: '', email: '' };
        render(<ContactDetails member={memberWithoutHandles} isLoggedIn={true} userInfo={mockUserInfo} />);
        expect(screen.queryAllByAltText('linkedin')).toHaveLength(0);
        expect(screen.queryAllByAltText('twitter')).toHaveLength(0);
        expect(screen.queryAllByAltText('discord')).toHaveLength(0);
        expect(screen.queryAllByAltText('telegram')).toHaveLength(0);
        expect(screen.queryAllByAltText('email')).toHaveLength(0);
        expect(screen.queryAllByAltText('github')).toHaveLength(0);
    });

    it('should be able to click the linkedin url', () => {
        render(<ContactDetails member={mockMember} isLoggedIn={true} userInfo={mockUserInfo} />);
        const test = screen.queryAllByAltText('linkedin');
        const linkedIn= screen.queryAllByAltText('linkedin')[0].closest('a');
        if(linkedIn){
            fireEvent.click(linkedIn);
        }
    });
});