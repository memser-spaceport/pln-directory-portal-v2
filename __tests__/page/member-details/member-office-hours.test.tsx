import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberOfficeHours from '@/components/page/member-details/member-office-hours';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { createFollowUp, getFollowUps } from '@/services/office-hours.service';
import { toast } from 'react-toastify';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { triggerLoader } from '@/utils/common.utils';
jest.mock('@/analytics/members.analytics');

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('js-cookie', () => ({
    get: jest.fn(),
}));

jest.mock('@/services/office-hours.service', () => ({
    createFollowUp: jest.fn(),
    getFollowUps: jest.fn(),
}));

jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
    },
}));

const mockUseMemberAnalytics = useMemberAnalytics as jest.Mock;

describe('MemberOfficeHours', () => {
    const mockRouter = { push: jest.fn(), refresh: jest.fn() };
    const mockAuthAnalytics = { onLoginBtnClicked: jest.fn() };

    beforeEach(() => {
        mockUseMemberAnalytics.mockReturnValue({
            onOfficeHourClicked: jest.fn(), onLearnMoreClicked: jest.fn()
          });
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        jest.clearAllMocks();
    });

    const renderComponent = (props: any) => {
        return render(<MemberOfficeHours {...props} />);
    };

    it('should render login button when user is not logged in', () => {
        renderComponent({ isLoggedIn: false });

        expect(screen.getByText('Login to Schedule')).toBeInTheDocument();
    });

    it('should render schedule meeting button when user is logged in and office hours are available', () => {
        renderComponent({ isLoggedIn: true, member: { officeHours: 'http://example.com' } });

        expect(screen.getByText('Schedule Meeting')).toBeInTheDocument();
    });

    it('should render not available button when user is logged in and office hours are not available', () => {
        renderComponent({ isLoggedIn: true, member: { officeHours: null } });

        expect(screen.getByText('Not Available')).toBeInTheDocument();
    });

    it('should call onLoginClickHandler when login button is clicked', () => {
        renderComponent({ isLoggedIn: false });

        fireEvent.click(screen.getByText('Login to Schedule'));

        expect(mockRouter.push).toHaveBeenCalled();
    });

    it('should call onLearnMoreBtnClick when learn more button is clicked', () => {
        const { onLearnMoreClicked } = useMemberAnalytics();
        renderComponent({ isLoggedIn: true, member: { officeHours: 'http://example.com' } });

        fireEvent.click(screen.getByText('Learn more'));

        expect(onLearnMoreClicked).toHaveBeenCalled();
    });

    it('should call onScheduleMeeting when schedule meeting button is clicked', async () => {
        (Cookies.get as jest.Mock).mockReturnValue('authToken');
        (createFollowUp as jest.Mock).mockResolvedValue({});
        (getFollowUps as jest.Mock).mockResolvedValue({ data: [] });

        renderComponent({ isLoggedIn: true, member: { id: 'memberId', officeHours: 'http://example.com' }, userInfo: { uid: 'userId' } });

        fireEvent.click(screen.getByText('Schedule Meeting'));

        expect(createFollowUp).toHaveBeenCalled();
    });

    it('should call onScheduleMeeting when schedule meeting button is clicked', async () => {
        (Cookies.get as jest.Mock).mockReturnValue('authToken');
        (createFollowUp as jest.Mock).mockResolvedValue({});
        (getFollowUps as jest.Mock).mockResolvedValue({ data: undefined });

        renderComponent({ isLoggedIn: true, member: { id: 'memberId', officeHours: 'http://example.com' }, userInfo: { uid: 'userId' } });

        fireEvent.click(screen.getByText('Schedule Meeting'));

        expect(createFollowUp).toHaveBeenCalled();
    });

    it('should show error toast when createFollowUp returns an error', async () => {
        (Cookies.get as jest.Mock).mockReturnValue('authToken');
        (toast.error as jest.Mock).mockImplementation(() => {});
        (createFollowUp as jest.Mock).mockResolvedValue({ error: { data: { message: 'yourself is forbidden' } } });

        renderComponent({ isLoggedIn: true, member: { id: 'memberId', officeHours: 'http://example.com' }, userInfo: { uid: 'userId' } });

        await fireEvent.click(screen.getByText('Schedule Meeting'));

        expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.SELF_INTERACTION_FORBIDDEN);
    });

    it('should show error toast when createFollowUp returns an error', async () => {
        (Cookies.get as jest.Mock).mockReturnValue('authToken');
        (toast.error as jest.Mock).mockImplementation(() => {});
        (createFollowUp as jest.Mock).mockResolvedValue({ error: { data: { message: 'Interaction with same user within 30 minutes is forbidden' } } });

        renderComponent({ isLoggedIn: true, member: { id: 'memberId', officeHours: 'http://example.com' }, userInfo: { uid: 'userId' } });

        await fireEvent.click(screen.getByText('Schedule Meeting'));

        expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.INTERACTION_RESTRICTED);
    });

    it('should handle exceptions properly when userinfo is null', async () => {
        (Cookies.get as jest.Mock).mockReturnValue('authToken');
        (toast.error as jest.Mock).mockImplementation(() => {});
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        (createFollowUp as jest.Mock).mockResolvedValue({ error: { data: { message: 'Interaction with same user within 30 minutes is forbidden' } } });

        renderComponent({ isLoggedIn: true, member: { id: 'memberId', officeHours: 'http://example.com' }, userInfo: null });

        await fireEvent.click(screen.getByText('Schedule Meeting'));
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    it('should handle exceptions properly when authtoken is undefined', async () => {
        (Cookies.get as jest.Mock).mockReturnValue(undefined);
        (toast.error as jest.Mock).mockImplementation(() => {});

        (createFollowUp as jest.Mock).mockResolvedValue({ data: [] });

        renderComponent({ isLoggedIn: true, member: { id: 'memberId', officeHours: 'http://example.com' }, userInfo: { uid: undefined } });

        await fireEvent.click(screen.getByText('Schedule Meeting'));
    });

    it('should open office hours link in a new tab when schedule meeting is successful', async () => {
      (Cookies.get as jest.Mock).mockReturnValue('authToken');
      (createFollowUp as jest.Mock).mockResolvedValue({});
      (getFollowUps as jest.Mock).mockResolvedValue({ data: [] });
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();

      renderComponent({ isLoggedIn: true, member: { id: 'memberId', officeHours: 'http://example.com' }, userInfo: { uid: 'userId' } });

      await fireEvent.click(screen.getByText('Schedule Meeting'));

      expect(windowOpenSpy).toHaveBeenCalledWith('http://example.com', '_blank');
      windowOpenSpy.mockRestore();
    });

    it('should dispatch TRIGGER_RATING_POPUP and GET_NOTIFICATIONS events when follow-ups are available', async () => {
      (Cookies.get as jest.Mock).mockReturnValue('authToken');
      (createFollowUp as jest.Mock).mockResolvedValue({});
      (getFollowUps as jest.Mock).mockResolvedValue({ data: [{ id: 'followUpId' }] });
      const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');

      renderComponent({ isLoggedIn: true, member: { id: 'memberId', officeHours: 'http://example.com' }, userInfo: { uid: 'userId' } });

      await fireEvent.click(screen.getByText('Schedule Meeting'));

      expect(dispatchEventSpy).toHaveBeenCalled();
      dispatchEventSpy.mockRestore();
    });
    
});