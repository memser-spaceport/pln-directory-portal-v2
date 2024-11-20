import { render, screen, fireEvent } from '@testing-library/react';
import MemberEmptyProjectExperience from '@/components/page/member-details/member-empty-project-experienct';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { ADMIN_ROLE } from '@/utils/constants';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/analytics/members.analytics', () => ({
    useMemberAnalytics: jest.fn(),
}));

describe('MemberEmptyProjectExperience', () => {
    const mockPush = jest.fn();
    const mockAnalytics = {
        onProjectContributionAddlicked: jest.fn(),
    };

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (useMemberAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const defaultProps = {
        userInfo: { uid: '1', roles: [] },
        member: { id: '1' },
        profileType: 'member',
    };

    it('renders add project experience link for owner', () => {
        render(<MemberEmptyProjectExperience {...defaultProps} />);
        expect(screen.getByText('Click here')).toBeInTheDocument();
    });

    it('renders add project experience link for admin', () => {
        const props = {
            ...defaultProps,
            userInfo: { uid: '2', roles: [ADMIN_ROLE] },
        };
        render(<MemberEmptyProjectExperience {...props} />);
        expect(screen.getByText('Click here')).toBeInTheDocument();
    });

    it('renders no project added message for non-owner and non-admin', () => {
        const props = {
            ...defaultProps,
            userInfo: { uid: '2', roles: [] },
        };
        render(<MemberEmptyProjectExperience {...props} />);
        expect(screen.getByText('No project added yet.')).toBeInTheDocument();
    });

    it('calls onEditOrAdd and navigates to correct route for owner', () => {
        render(<MemberEmptyProjectExperience {...defaultProps} />);
        fireEvent.click(screen.getByText('Click here'));
        expect(mockAnalytics.onProjectContributionAddlicked).toHaveBeenCalledWith(defaultProps.member);
        expect(mockPush).toHaveBeenCalledWith('/settings/profile');
    });

    it('calls onEditOrAdd and navigates to correct route for admin', () => {
        const props = {
            ...defaultProps,
            userInfo: { uid: '2', roles: [ADMIN_ROLE] },
        };
        render(<MemberEmptyProjectExperience {...props} />);
        fireEvent.click(screen.getByText('Click here'));
        expect(mockAnalytics.onProjectContributionAddlicked).toHaveBeenCalledWith(props.member);
        expect(mockPush).toHaveBeenCalledWith('/settings/members?id=1');
    });
});