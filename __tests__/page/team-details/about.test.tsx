import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import About from '@/components/page/team-details/about';
import {  IUserInfo } from '@/types/shared.types';
import { ITeam, ITag } from '@/types/teams.types';
import Cookies from 'js-cookie';
import { updateTeam } from '@/services/teams.service';

const mockAnalytics = {
    onTeamDetailAboutShowMoreClicked: jest.fn(),
    onTeamDetailAboutShowLessClicked: jest.fn(),
    onTeamDetailAboutEditClicked: jest.fn(),
    onTeamDetailAboutEditCancelClicked: jest.fn(),
    onTeamDetailAboutEditSaveClicked: jest.fn(),
    recordAboutSave: jest.fn(),
};

jest.mock('@/analytics/teams.analytics', () => ({
    useTeamAnalytics: () => mockAnalytics,
}));

// jest.mock('js-cookie', () => ({
//     get: jest.fn().mockReturnValue('"mockAuthToken"'),
// }));

jest.mock('@/services/teams.service', () => ({
    updateTeam: jest.fn().mockResolvedValue({ data: {}, isError: false }),
}));

jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

beforeEach(() => {
    jest.clearAllMocks();
  });

describe('About Component', () => {
    const team: ITeam = {
        id: '1',
        name: 'Team A',
        contactMethod: 'Email',
        technologies: [{ title: 'React' }, { title: 'Node.js' }],
        industryTags: [{ title: 'Tech' }],
        fundingStage: { title: 'Seed' },
        membershipSources: [{ title: 'Source A' }],
        logoUid: 'logo123',
        maintainingProjects: [],
        contributingProjects: [],
        teamFocusAreas: []
    };

    const userInfo: IUserInfo = {
        name: 'User A',
    };

    const props = {
        about: 'This is a test about content.',
        team,
        userInfo,
        hasTeamEditAccess: true,
    };

    it('renders About component', () => {
        render(<About {...props} />);
        expect(screen.getByText('About')).toBeInTheDocument();
        expect(screen.getByText('This is a test about content.')).toBeInTheDocument();
    });

    it('shows more content when "show more" is clicked', () => {
        props.about = 'This is a test about content. '.repeat(20);
        render(<About {...props} />);
        fireEvent.click(screen.getByText('show more'));
        expect(mockAnalytics.onTeamDetailAboutShowMoreClicked).toHaveBeenCalled();
    });

    it('shows less content when "show less" is clicked', () => {
        render(<About {...props} />);
        fireEvent.click(screen.getByText('show more'));
        fireEvent.click(screen.getByText('show less'));
        expect(mockAnalytics.onTeamDetailAboutShowLessClicked).toHaveBeenCalled();
    });

    it('enables editor when "Edit" is clicked', () => {
        const { container } = render(<About {...props} />);
        fireEvent.click(screen.getByText('Edit'));
        expect(mockAnalytics.onTeamDetailAboutEditClicked).toHaveBeenCalled();
        expect(container.querySelector('.about__header__action__cancel__txt')?.textContent).toBe('Cancel'); //
        expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('cancels editing when "Cancel" is clicked', async () => {
        props.about = 'This is a test about content.';
        const { container } = render(<About {...props} />);
        fireEvent.click(screen.getByText('Edit'));
        const cancel = container.querySelector('.about__header__action__cancel__txt');
        if(cancel){
            expect(cancel?.textContent).toBe('Cancel'); //
            await fireEvent.click(cancel);
            expect(mockAnalytics.onTeamDetailAboutEditCancelClicked).toHaveBeenCalled();
        }
        expect(screen.getByText('This is a test about content.')).toBeInTheDocument();
    });

    it('saves edited content when "Save" is clicked', async () => {
        Cookies.get = jest.fn().mockReturnValue('"mockAuthToken"');
        render(<About {...props} />);
        await fireEvent.click(screen.getByText('Edit'));
        fireEvent.click(screen.getByText('Save'));
        expect(mockAnalytics.onTeamDetailAboutEditSaveClicked).toHaveBeenCalled();
        expect(updateTeam).toHaveBeenCalled();
    });

    it('save fails when "Save" is clicked', async () => {
        Cookies.get = jest.fn().mockReturnValue(undefined);
        render(<About {...props} />);
        await fireEvent.click(screen.getByText('Edit'));
        await fireEvent.click(screen.getByText('Save'));
        expect(updateTeam).not.toHaveBeenCalled();
    });

    it('updateTeam fails "Save" is clicked', async () => {
        Cookies.get = jest.fn().mockReturnValue('"mockAuthToken"');
        (updateTeam as jest.Mock).mockResolvedValue({ data: {}, isError: true });
        render(<About {...props} />);
        await fireEvent.click(screen.getByText('Edit'));
        await fireEvent.click(screen.getByText('Save'));
        expect(mockAnalytics.recordAboutSave).toHaveBeenCalled();
    });

});