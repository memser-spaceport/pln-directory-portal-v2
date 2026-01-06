'use client';

import { useState } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { PushNotification } from '@/types/push-notifications.types';
import {
  ModalHeader,
  AboutSection,
  GatheringDetails,
  AttendeesSection,
  PlanningSection,
  ModalFooter,
  DatePickerView,
} from './components';
import s from './IrlGatheringModal.module.scss';

export interface IrlGatheringModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: PushNotification;
  onGoingClick?: () => void;
}

type ModalView = 'main' | 'datePicker';

export function IrlGatheringModal({ isOpen, onClose, notification, onGoingClick }: IrlGatheringModalProps) {
  const [currentView, setCurrentView] = useState<ModalView>('main');
  const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null);

  const metadata = notification.metadata || {};
  const gatheringName = (metadata.gatheringName as string) || notification.title;
  const gatheringImage = metadata.gatheringImage as string;
  const aboutDescription = (metadata.aboutDescription as string) || notification.description || '';
  const dateRange = (metadata.dateRange as string) || 'TBD';
  const location = (metadata.location as string) || 'TBD';
  const telegramLink = metadata.telegramLink as string;
  const eventsCount = (metadata.eventsCount as number) || 0;
  const eventsLink = metadata.eventsLink as string;
  const speakerIntakeLink = metadata.speakerIntakeLink as string;
  const submittedEventsCount = (metadata.submittedEventsCount as number) || 0;
  const submitEventLink = metadata.submitEventLink as string;
  const otherResourcesLink = metadata.otherResourcesLink as string;
  const attendees = (metadata.attendees as Array<{ uid: string; picture?: string }>) || [];
  const attendeesCount = (metadata.attendeesCount as number) || 0;
  const planningQuestion = (metadata.planningQuestion as string) || `Are you planning to be in ${location}?`;

  const handleOpenDatePicker = () => {
    setCurrentView('datePicker');
  };

  const handleDatePickerCancel = () => {
    setCurrentView('main');
  };

  const handleDatePickerApply = (range: [Date, Date] | null) => {
    setSelectedDateRange(range);
    setCurrentView('main');
  };

  if (currentView === 'datePicker') {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <DatePickerView
          planningQuestion={planningQuestion}
          initialRange={selectedDateRange}
          onCancel={handleDatePickerCancel}
          onApply={handleDatePickerApply}
        />
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={s.modal}>
        <ModalHeader gatheringName={gatheringName} gatheringImage={gatheringImage} onClose={onClose} />

        <div className={s.content}>
          <AboutSection description={aboutDescription} />

          <GatheringDetails
            dateRange={dateRange}
            location={location}
            telegramLink={telegramLink}
            eventsLink={eventsLink}
            eventsCount={eventsCount}
            speakerIntakeLink={speakerIntakeLink}
            submitEventLink={submitEventLink}
            submittedEventsCount={submittedEventsCount}
            otherResourcesLink={otherResourcesLink}
          />

          <AttendeesSection attendees={attendees} attendeesCount={attendeesCount} gatheringLink={notification.link} />

          <PlanningSection
            planningQuestion={planningQuestion}
            selectedDateRange={selectedDateRange}
            onInputClick={handleOpenDatePicker}
          />
        </div>

        <ModalFooter onClose={onClose} onGoingClick={onGoingClick} />
      </div>
    </Modal>
  );
}
