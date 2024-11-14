import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EVENTS } from '@/utils/constants';
import Cookies from 'js-cookie';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import MemberBioModal from '@/components/page/home/featured/member-bio-modal';

jest.mock('js-cookie');
jest.mock('@/analytics/home.analytics');

const mockMember = {
  id: '1',
  name: 'John Doe',
  bio: 'This is a bio',
};

describe('MemberBioModal', () => {
  let analyticsMock: any;

  beforeEach(() => {
    analyticsMock = {
      onMmeberBioPopupViewProfileBtnClicked: jest.fn(),
    };
    (useHomeAnalytics as jest.Mock).mockReturnValue(analyticsMock);
    Cookies.get = jest.fn().mockReturnValue(JSON.stringify({ userId: '123' }));
    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();
  });

  it('renders MemberBioModal component', () => {
    render(<MemberBioModal />);
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('opens the modal on event', async () => {
    render(<MemberBioModal />);
    const event = new CustomEvent(EVENTS.OPEN_MEMBER_BIO_POPUP, { detail: { member: mockMember } });
    await act(async () => {
      document.dispatchEvent(event);
    });

    
    expect(screen.getByText("John Doe's Intro")).toBeInTheDocument();
  });

  it('closes the modal when close button is clicked', () => {
    render(<MemberBioModal />);
    const event = new CustomEvent(EVENTS.OPEN_MEMBER_BIO_POPUP, { detail: { member: mockMember } });
    document.dispatchEvent(event);
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByText("John Doe's Intro")).not.toBeInTheDocument();
  });


  it('triggers analytics and opens profile page on View Profile button click', async () => {
    // Mock window.open
    const windowOpenMock = jest.spyOn(window, 'open').mockImplementation(() => window);
  
    render(<MemberBioModal />);
    
    // Dispatch the event to open the modal and set the member data
    const event = new CustomEvent(EVENTS.OPEN_MEMBER_BIO_POPUP, { detail: { member: mockMember } });
    await act(async () => {
      document.dispatchEvent(event);
    });
    
    // Click the "View Profile" button
    fireEvent.click(screen.getByText('View Profile'));
    
    // Check that the analytics function was called
    expect(analyticsMock.onMmeberBioPopupViewProfileBtnClicked).toHaveBeenCalled();
    
    // Check that window.open was called with the correct URL
    expect(windowOpenMock).toHaveBeenCalledWith(`/members/${mockMember.id}`);
    
    // Clean up the mock
    windowOpenMock.mockRestore();
  });
  
  
});
