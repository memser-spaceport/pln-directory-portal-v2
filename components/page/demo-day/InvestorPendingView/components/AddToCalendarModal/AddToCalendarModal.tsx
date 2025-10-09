import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import s from './AddToCalendarModal.module.scss';
import { useSetCalendarAdded } from '@/services/demo-day/hooks/useSetCalendarAdded';
import { toast } from '@/components/core/ToastContainer';

const CalendarPlusIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M26 4H23V3C23 2.73478 22.8946 2.48043 22.7071 2.29289C22.5196 2.10536 22.2652 2 22 2C21.7348 2 21.4804 2.10536 21.2929 2.29289C21.1054 2.48043 21 2.73478 21 3V4H11V3C11 2.73478 10.8946 2.48043 10.7071 2.29289C10.5196 2.10536 10.2652 2 10 2C9.73478 2 9.48043 2.10536 9.29289 2.29289C9.10536 2.48043 9 2.73478 9 3V4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V26C4 26.5304 4.21071 27.0391 4.58579 27.4142C4.96086 27.7893 5.46957 28 6 28H26C26.5304 28 27.0391 27.7893 27.4142 27.4142C27.7893 27.0391 28 26.5304 28 26V6C28 5.46957 27.7893 4.96086 27.4142 4.58579C27.0391 4.21071 26.5304 4 26 4ZM19 20H17V22C17 22.2652 16.8946 22.5196 16.7071 22.7071C16.5196 22.8946 16.2652 23 16 23C15.7348 23 15.4804 22.8946 15.2929 22.7071C15.1054 22.5196 15 22.2652 15 22V20H13C12.7348 20 12.4804 19.8946 12.2929 19.7071C12.1054 19.5196 12 19.2652 12 19C12 18.7348 12.1054 18.4804 12.2929 18.2929C12.4804 18.1054 12.7348 18 13 18H15V16C15 15.7348 15.1054 15.4804 15.2929 15.2929C15.4804 15.1054 15.7348 15 16 15C16.2652 15 16.5196 15.1054 16.7071 15.2929C16.8946 15.4804 17 15.7348 17 16V18H19C19.2652 18 19.5196 18.1054 19.7071 18.2929C19.8946 18.4804 20 18.7348 20 19C20 19.2652 19.8946 19.5196 19.7071 19.7071C19.5196 19.8946 19.2652 20 19 20ZM6 10V6H9V7C9 7.26522 9.10536 7.51957 9.29289 7.70711C9.48043 7.89464 9.73478 8 10 8C10.2652 8 10.5196 7.89464 10.7071 7.70711C10.8946 7.51957 11 7.26522 11 7V6H21V7C21 7.26522 21.1054 7.51957 21.2929 7.70711C21.4804 7.89464 21.7348 8 22 8C22.2652 8 22.5196 7.89464 22.7071 7.70711C22.8946 7.51957 23 7.26522 23 7V6H26V10H6Z"
      fill="#1B4DFF"
    />
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.0306 11.9694C13.1715 12.1103 13.2506 12.3014 13.2506 12.5006C13.2506 12.6999 13.1715 12.891 13.0306 13.0319C12.8897 13.1728 12.6986 13.2519 12.4993 13.2519C12.3001 13.2519 12.109 13.1728 11.9681 13.0319L7.99997 9.0625L4.0306 13.0306C3.8897 13.1715 3.69861 13.2507 3.49935 13.2507C3.30009 13.2507 3.10899 13.1715 2.9681 13.0306C2.8272 12.8897 2.74805 12.6986 2.74805 12.4994C2.74805 12.3001 2.8272 12.109 2.9681 11.9681L6.93747 8L2.96935 4.03063C2.82845 3.88973 2.7493 3.69864 2.7493 3.49938C2.7493 3.30012 2.82845 3.10902 2.96935 2.96813C3.11024 2.82723 3.30134 2.74808 3.5006 2.74808C3.69986 2.74808 3.89095 2.82723 4.03185 2.96813L7.99997 6.9375L11.9693 2.9675C12.1102 2.82661 12.3013 2.74745 12.5006 2.74745C12.6999 2.74745 12.8909 2.82661 13.0318 2.9675C13.1727 3.1084 13.2519 3.2995 13.2519 3.49875C13.2519 3.69801 13.1727 3.88911 13.0318 4.03L9.06247 8L13.0306 11.9694Z"
      fill="#455468"
    />
  </svg>
);

const GoogleCalendarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M26.2515 14.2721C26.2515 13.2649 26.1681 12.5299 25.9876 11.7676H14.2515V16.3137H21.1403C21.0015 17.4435 20.2515 19.1448 18.5848 20.2881L18.5614 20.4403L22.2721 23.2575L22.5292 23.2826C24.8903 21.1457 26.2515 18.0015 26.2515 14.2721Z"
      fill="white"
    />
    <path
      d="M14.2506 26.25C17.6256 26.25 20.4589 25.161 22.5284 23.2827L18.5839 20.2882C17.5284 21.0096 16.1117 21.5132 14.2506 21.5132C10.9451 21.5132 8.13959 19.3763 7.1395 16.4227L6.99291 16.4349L3.13444 19.3613L3.08398 19.4988C5.13951 23.5004 9.36173 26.25 14.2506 26.25Z"
      fill="white"
    />
    <path
      d="M7.14029 16.4227C6.87641 15.6605 6.72369 14.8438 6.72369 14C6.72369 13.156 6.87641 12.3394 7.12641 11.5772L7.11942 11.4148L3.21259 8.44144L3.08476 8.50102C2.23758 10.1616 1.75146 12.0264 1.75146 14C1.75146 15.9736 2.23758 17.8382 3.08476 19.4988L7.14029 16.4227Z"
      fill="white"
    />
    <path
      d="M14.2507 6.48663C16.5979 6.48663 18.1812 7.48024 19.084 8.31057L22.6118 4.935C20.4452 2.96139 17.6257 1.75 14.2507 1.75C9.36176 1.75 5.13952 4.49942 3.08398 8.50106L7.12564 11.5772C8.13962 8.6236 10.9452 6.48663 14.2507 6.48663Z"
      fill="white"
    />
  </svg>
);

const OutlookIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.75 3.5H20.125V2.625C20.125 2.39294 20.0328 2.17038 19.8687 2.00628C19.7046 1.84219 19.4821 1.75 19.25 1.75C19.0179 1.75 18.7954 1.84219 18.6313 2.00628C18.4672 2.17038 18.375 2.39294 18.375 2.625V3.5H9.625V2.625C9.625 2.39294 9.53281 2.17038 9.36872 2.00628C9.20462 1.84219 8.98206 1.75 8.75 1.75C8.51794 1.75 8.29538 1.84219 8.13128 2.00628C7.96719 2.17038 7.875 2.39294 7.875 2.625V3.5H5.25C4.78587 3.5 4.34075 3.68437 4.01256 4.01256C3.68437 4.34075 3.5 4.78587 3.5 5.25V22.75C3.5 23.2141 3.68437 23.6592 4.01256 23.9874C4.34075 24.3156 4.78587 24.5 5.25 24.5H22.75C23.2141 24.5 23.6592 24.3156 23.9874 23.9874C24.3156 23.6592 24.5 23.2141 24.5 22.75V5.25C24.5 4.78587 24.3156 4.34075 23.9874 4.01256C23.6592 3.68437 23.2141 3.5 22.75 3.5ZM7.875 5.25V6.125C7.875 6.35706 7.96719 6.57962 8.13128 6.74372C8.29538 6.90781 8.51794 7 8.75 7C8.98206 7 9.20462 6.90781 9.36872 6.74372C9.53281 6.57962 9.625 6.35706 9.625 6.125V5.25H18.375V6.125C18.375 6.35706 18.4672 6.57962 18.6313 6.74372C18.7954 6.90781 19.0179 7 19.25 7C19.4821 7 19.7046 6.90781 19.8687 6.74372C20.0328 6.57962 20.125 6.35706 20.125 6.125V5.25H22.75V8.75H5.25V5.25H7.875ZM22.75 22.75H5.25V10.5H22.75V22.75ZM17.5 16.625C17.5 16.8571 17.4078 17.0796 17.2437 17.2437C17.0796 17.4078 16.8571 17.5 16.625 17.5H14.875V19.25C14.875 19.4821 14.7828 19.7046 14.6187 19.8687C14.4546 20.0328 14.2321 20.125 14 20.125C13.7679 20.125 13.5454 20.0328 13.3813 19.8687C13.2172 19.7046 13.125 19.4821 13.125 19.25V17.5H11.375C11.1429 17.5 10.9204 17.4078 10.7563 17.2437C10.5922 17.0796 10.5 16.8571 10.5 16.625C10.5 16.3929 10.5922 16.1704 10.7563 16.0063C10.9204 15.8422 11.1429 15.75 11.375 15.75H13.125V14C13.125 13.7679 13.2172 13.5454 13.3813 13.3813C13.5454 13.2172 13.7679 13.125 14 13.125C14.2321 13.125 14.4546 13.2172 14.6187 13.3813C14.7828 13.5454 14.875 13.7679 14.875 14V15.75H16.625C16.8571 15.75 17.0796 15.8422 17.2437 16.0063C17.4078 16.1704 17.5 16.3929 17.5 16.625Z"
      fill="#455468"
    />
  </svg>
);

interface AddToCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventDate?: string;
  eventTitle?: string;
}

export const AddToCalendarModal: React.FC<AddToCalendarModalProps> = ({
  isOpen,
  onClose,
  eventDate = '2024-10-25T12:00:00Z',
  eventTitle = 'Protocol Labs Demo Day',
}) => {
  const setCalendarAddedMutation = useSetCalendarAdded();

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const markCalendarAsAdded = async () => {
    try {
      await setCalendarAddedMutation.mutateAsync();
      toast.success('Event added to calendar!');
    } catch (error) {
      console.error('Failed to mark calendar as added:', error);
      // Don't show error toast - the calendar action itself succeeded
    }
  };

  const generateOutlookCalendarUrl = () => {
    const startDate = new Date(eventDate);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: eventTitle,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: 'Join us for Protocol Labs Demo Day to see innovative projects and connect with founders.',
      location: 'Virtual Event',
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  const generateICSFile = () => {
    const icsUrl = 'https://pl-directory-uploads-prod.s3.us-west-1.amazonaws.com/pl_f25_demo_day_investor_event.ics';

    // Create a hidden iframe to download the file
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = icsUrl;
    document.body.appendChild(iframe);

    // Remove the iframe after a short delay
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  const handleGoogleCalendar = async () => {
    window.open(
      'https://calendar.google.com/calendar/event?action=TEMPLATE&tmeid=MnFjZ2p0cWphYW05YjhxZ2kwM285dHFidm8gY18yMWRlZDg3OGJiNjU3NzA3ZTFhODE0NDNlMTIzNzViMmE3MzgyYzNiYmE0MzY4ZGQ3NDVlYjVlMGZlZmU3MjViQGc&tmsrc=c_21ded878bb657707e1a81443e12375b2a7382c3bba4368dd745eb5e0fefe725b%40group.calendar.google.com',
      '_blank',
    );
    await markCalendarAsAdded();
  };

  const handleOutlookCalendar = async () => {
    generateICSFile();
    await markCalendarAsAdded();
    onClose();
  };

  const handleAppleCalendar = async () => {
    generateICSFile();
    await markCalendarAsAdded();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={s.modalOverlay}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={s.modalContainer}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={s.modalContent}>
              {/* Icon */}
              <div className={s.iconContainer}>
                <CalendarPlusIcon />
              </div>

              {/* Text Content */}
              <div className={s.textContent}>
                <h2 className={s.title}>Add to Calendar</h2>
                <p className={s.description}>
                  We will send an email reminder close to the event date. You can also click on one of the buttons to
                  manually add the event to your calendar.
                </p>
              </div>

              {/* Calendar Buttons */}
              <div className={s.calendarButtons}>
                <button className={s.calendarButton} onClick={handleGoogleCalendar}>
                  <GoogleCalendarIcon />
                  <span>Google Calendar</span>
                </button>
                <button className={s.calendarButton2} onClick={handleOutlookCalendar}>
                  <OutlookIcon />
                  <span>iCal (Apple / Outlook)</span>
                </button>
              </div>

              {/* Close Button */}
              <button className={s.closeButton} onClick={onClose}>
                <IconX />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
