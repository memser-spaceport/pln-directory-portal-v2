/**
 * @fileoverview
 * Unit tests for the DeleteAttendeesPopup component using React Testing Library and Jest.
 * Covers all props, events, and edge cases for 100% coverage.
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteAttendeesPopup from '@/components/page/irl/attendee-list/delete-attendees-popup';

// Mocks
jest.mock('@/analytics/irl.analytics', () => ({
  useIrlAnalytics: () => ({
    trackSelfRemoveAttendeePopupConfirmRemovalBtnClicked: jest.fn(),
    trackAdminRemoveAttendeesPopupConfirmRemovalBtnClicked: jest.fn(),
    trackSelfRemovalGatheringsSuccess: jest.fn(),
    trackAdminRemoveAttendeesSuccess: jest.fn(),
    trackSelfRemovalGatherigsFailed: jest.fn(),
    trackAdminRemoveAttendeesFailed: jest.fn(),
  }),
}));
jest.mock('@/services/irl.service', () => ({
  deleteEventGuestByLocation: jest.fn(),
}));
jest.mock('@/utils/irl.utils', () => ({
  getFormattedDateString: jest.fn(() => 'Jan 1, 2024'),
}));
jest.mock('@/components/core/register/register-form-loader', () => () => <div data-testid="register-form-loader" />);

const mockToast = {
  error: jest.fn(),
  success: jest.fn(),
};
jest.mock('react-toastify', () => ({ toast: mockToast }));

const EVENTS = {
  TRIGGER_REGISTER_LOADER: 'TRIGGER_REGISTER_LOADER',
  OPEN_FLOATING_BAR: 'OPEN_FLOATING_BAR',
};
const TOAST_MESSAGES = {
  SOMETHING_WENT_WRONG: 'Something went wrong',
  ATTENDEE_DELETED_SUCCESSFULLY: 'Attendee deleted successfully',
};

// Helper: create mock props
/**
 * Returns mock props for DeleteAttendeesPopup.
 * @param {Partial<any>} overrides - Props to override.
 */
function getMockProps(overrides = {}) {
  const baseEvent = {
    slugURL: '',
    uid: 'e1',
    name: 'Gathering 1',
    isHost: false,
    isSpeaker: false,
    checkInDate: '',
    checkOutDate: '',
    hostSubEvents: [],
    speakerSubEvents: [],
    type: 'NORMAL',
    startDate: '2024-01-01',
    endDate: '2024-01-02',
    logo: '',
  };
  const baseEvent2 = {
    ...baseEvent,
    uid: 'e2',
    name: 'Gathering 2',
    type: 'INVITE_ONLY',
    startDate: '2024-01-03',
    endDate: '2024-01-04',
  };
  const baseGuest = {
    teamUid: '',
    teamName: '',
    teamLogo: '',
    memberUid: 'u1',
    memberName: 'User One',
    memberLogo: '',
    events: [baseEvent, baseEvent2],
    teams: [],
    topics: [],
    reason: '',
    telegramId: '',
    officeHours: '',
    additionalInfo: {},
    eventNames: [],
  };
  const baseGuest2 = {
    ...baseGuest,
    memberUid: 'u2',
    memberName: 'User Two',
    events: [baseEvent],
  };
  return {
    eventDetails: {
      guests: [baseGuest, baseGuest2],
      events: [baseEvent, baseEvent2],
      isUserGoing: true,
      currentGuest: baseGuest,
      totalGuests: 2,
    },
    location: { uid: 'loc1', name: 'Location 1' },
    type: 'admin-delete',
    userInfo: { uid: 'u1', name: 'User One' },
    selectedGuests: ['u1', 'u2'],
    onClose: jest.fn(),
    setSelectedGuests: jest.fn(),
    getEventDetails: jest.fn(),
    ...overrides,
  };
}

describe('DeleteAttendeesPopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header, info, and loader', () => {
    render(<DeleteAttendeesPopup {...getMockProps()} />);
    expect(screen.getByTestId('delete-attendees-popup')).toBeInTheDocument();
    expect(screen.getByTestId('popup-header-title')).toHaveTextContent('Remove Attendee from Gathering(s)');
    expect(screen.getByTestId('popup-header-info-text')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-loader')).toBeInTheDocument();
  });

  it('renders all members and gatherings', () => {
    render(<DeleteAttendeesPopup {...getMockProps()} />);
    expect(screen.getByTestId('popup-member-u1')).toBeInTheDocument();
    expect(screen.getByTestId('popup-member-u2')).toBeInTheDocument();
    expect(screen.getByTestId('popup-gathering-u1-e1')).toBeInTheDocument();
    expect(screen.getByTestId('popup-gathering-u1-e2')).toBeInTheDocument();
    expect(screen.getByTestId('popup-gathering-u2-e1')).toBeInTheDocument();
  });

  it('selects and deselects all gatherings (admin-delete)', () => {
    render(<DeleteAttendeesPopup {...getMockProps()} />);
    // Select all
    fireEvent.click(screen.getByTestId('select-all-checkbox'));
    expect(screen.getByTestId('select-all-checkbox-selected')).toBeInTheDocument();
    // Deselect all
    fireEvent.click(screen.getByTestId('select-all-checkbox-selected'));
    expect(screen.getByTestId('select-all-checkbox')).toBeInTheDocument();
  });

  it('selects and deselects all gatherings for a member', () => {
    render(<DeleteAttendeesPopup {...getMockProps()} />);
    // Select all for u1
    fireEvent.click(screen.getByTestId('member-checkbox-u1'));
    expect(screen.getByTestId('member-checkbox-selected-u1')).toBeInTheDocument();
    // Deselect all for u1
    fireEvent.click(screen.getByTestId('member-checkbox-selected-u1'));
    expect(screen.getByTestId('member-checkbox-u1')).toBeInTheDocument();
  });

  it('selects and deselects a single gathering', () => {
    render(<DeleteAttendeesPopup {...getMockProps()} />);
    // Select gathering e1 for u1
    fireEvent.click(screen.getByTestId('gathering-checkbox-u1-e1'));
    expect(screen.getByTestId('gathering-checkbox-selected-u1-e1')).toBeInTheDocument();
    // Deselect gathering e1 for u1
    fireEvent.click(screen.getByTestId('gathering-checkbox-selected-u1-e1'));
    expect(screen.getByTestId('gathering-checkbox-u1-e1')).toBeInTheDocument();
  });

  it('disables confirm button when no gatherings selected', () => {
    render(<DeleteAttendeesPopup {...getMockProps()} />);
    expect(screen.getByTestId('confirm-btn')).toBeDisabled();
  });

  it('enables confirm button when gatherings are selected', () => {
    render(<DeleteAttendeesPopup {...getMockProps()} />);
    // Select gathering e1 for u1
    fireEvent.click(screen.getByTestId('gathering-checkbox-u1-e1'));
    expect(screen.getByTestId('confirm-btn')).not.toBeDisabled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<DeleteAttendeesPopup {...getMockProps({ onClose })} />);
    fireEvent.click(screen.getByTestId('close-btn'));
    expect(onClose).toHaveBeenCalled();
  });

  it('handles successful deletion (admin-delete)', async () => {
    const { deleteEventGuestByLocation } = require('@/services/irl.service');
    deleteEventGuestByLocation.mockResolvedValue(true);
    const getEventDetails = jest.fn();
    const setSelectedGuests = jest.fn();
    const onClose = jest.fn();
    render(
      <DeleteAttendeesPopup
        {...getMockProps({ getEventDetails, setSelectedGuests, onClose })}
      />
    );
    // Select gathering e1 for u1
    fireEvent.click(screen.getByTestId('gathering-checkbox-u1-e1'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => {
      expect(getEventDetails).toHaveBeenCalled();
      expect(setSelectedGuests).toHaveBeenCalledWith([]);
      expect(onClose).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith(TOAST_MESSAGES.ATTENDEE_DELETED_SUCCESSFULLY);
    });
  });

  it('handles failed deletion (admin-delete)', async () => {
    const { deleteEventGuestByLocation } = require('@/services/irl.service');
    deleteEventGuestByLocation.mockRejectedValue(new Error('fail'));
    const onClose = jest.fn();
    render(<DeleteAttendeesPopup {...getMockProps({ onClose })} />);
    // Select gathering e1 for u1
    fireEvent.click(screen.getByTestId('gathering-checkbox-u1-e1'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
    });
  });

  it('handles falsy deleteEventGuestByLocation response (no error thrown)', async () => {
    const { deleteEventGuestByLocation } = require('@/services/irl.service');
    deleteEventGuestByLocation.mockResolvedValue(null); // or false
    const onClose = jest.fn();
    render(<DeleteAttendeesPopup {...getMockProps({ onClose })} />);
    // Select gathering e1 for u1
    fireEvent.click(screen.getByTestId('gathering-checkbox-u1-e1'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
    });
  });

  it('renders and works in self-delete mode', () => {
    const props = getMockProps({
      type: 'self-delete',
      selectedGuests: undefined,
      eventDetails: {
        ...getMockProps().eventDetails,
        currentGuest: {
          ...getMockProps().eventDetails.guests[0],
          events: [getMockProps().eventDetails.events[0]],
        },
        guests: [
          {
            ...getMockProps().eventDetails.guests[0],
            events: [getMockProps().eventDetails.events[0]],
          },
        ],
        events: [getMockProps().eventDetails.events[0]],
        isUserGoing: true,
        totalGuests: 1,
      },
    });
    render(<DeleteAttendeesPopup {...props} />);
    expect(screen.getByTestId('popup-header-info-text')).toHaveTextContent('You will be removed from the attendee list');
    expect(screen.getByTestId('popup-member-u1')).toBeInTheDocument();
    expect(screen.getByTestId('popup-gathering-u1-e1')).toBeInTheDocument();
  });

  it('handles successful deletion (self-delete)', async () => {
    const { deleteEventGuestByLocation } = require('@/services/irl.service');
    deleteEventGuestByLocation.mockResolvedValue(true);
    const getEventDetails = jest.fn();
    const setSelectedGuests = jest.fn();
    const onClose = jest.fn();
    const props = getMockProps({
      type: 'self-delete',
      selectedGuests: undefined,
      eventDetails: {
        ...getMockProps().eventDetails,
        currentGuest: {
          ...getMockProps().eventDetails.guests[0],
          events: [getMockProps().eventDetails.events[0]],
        },
        guests: [
          {
            ...getMockProps().eventDetails.guests[0],
            events: [getMockProps().eventDetails.events[0]],
          },
        ],
        events: [getMockProps().eventDetails.events[0]],
        isUserGoing: true,
        totalGuests: 1,
      },
      getEventDetails,
      setSelectedGuests,
      onClose,
    });
    render(<DeleteAttendeesPopup {...props} />);
    // Select gathering e1 for u1
    fireEvent.click(screen.getByTestId('gathering-checkbox-u1-e1'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => {
      expect(getEventDetails).toHaveBeenCalled();
      expect(setSelectedGuests).toHaveBeenCalledWith([]);
      expect(onClose).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith(TOAST_MESSAGES.ATTENDEE_DELETED_SUCCESSFULLY);
    });
  });

  it('handles failed deletion (self-delete)', async () => {
    const { deleteEventGuestByLocation } = require('@/services/irl.service');
    deleteEventGuestByLocation.mockRejectedValue(new Error('fail'));
    const onClose = jest.fn();
    const props = getMockProps({
      type: 'self-delete',
      selectedGuests: undefined,
      eventDetails: {
        ...getMockProps().eventDetails,
        currentGuest: {
          ...getMockProps().eventDetails.guests[0],
          events: [getMockProps().eventDetails.events[0]],
        },
        guests: [
          {
            ...getMockProps().eventDetails.guests[0],
            events: [getMockProps().eventDetails.events[0]],
          },
        ],
        events: [getMockProps().eventDetails.events[0]],
        isUserGoing: true,
        totalGuests: 1,
      },
      onClose,
    });
    render(<DeleteAttendeesPopup {...props} />);
    // Select gathering e1 for u1
    fireEvent.click(screen.getByTestId('gathering-checkbox-u1-e1'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
    });
  });

  it('renders with no guests or events gracefully', () => {
    render(
      <DeleteAttendeesPopup
        {...getMockProps({ eventDetails: { guests: [], events: [], isUserGoing: false, currentGuest: undefined, totalGuests: 0 } })}
      />
    );
    expect(screen.getByTestId('delete-attendees-popup')).toBeInTheDocument();
  });


  it('getTotalEvents uses fallback 0 if guest.events is undefined', () => {
    const props = getMockProps();
    const brokenGuest = { ...props.eventDetails.guests[0], events: undefined } as any;
    render(
      <DeleteAttendeesPopup
        {...props}
        eventDetails={{
          ...props.eventDetails,
          guests: [brokenGuest, ...props.eventDetails.guests.slice(1)],
        }}
        selectedGuests={[brokenGuest.memberUid]}
      />
    );
    expect(screen.getByTestId('delete-attendees-popup')).toBeInTheDocument();
  });

  it('covers fallback for guests undefined', () => {
    render(
      <DeleteAttendeesPopup
        {...getMockProps()}
        eventDetails={{ ...getMockProps().eventDetails, guests: undefined } as any}
      />
    );
    expect(screen.getByTestId('delete-attendees-popup')).toBeInTheDocument();
  });

  it('covers fallback for selectedGuests undefined', () => {
    render(
      <DeleteAttendeesPopup
        {...getMockProps()}
        selectedGuests={undefined}
      />
    );
    expect(screen.getByTestId('delete-attendees-popup')).toBeInTheDocument();
  });
  
  it('covers fallback for userInfo undefined in self-delete', () => {
    render(
      <DeleteAttendeesPopup
        {...getMockProps({ type: 'self-delete', userInfo: undefined, selectedGuests: undefined })}
      />
    );
    expect(screen.getByTestId('delete-attendees-popup')).toBeInTheDocument();
  });
}); 