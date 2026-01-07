'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Modal } from '@/components/common/Modal/Modal';
import { PushNotification, IrlGatheringMetadata } from '@/types/push-notifications.types';
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

export interface IrlGatheringFormData {
  topics: string[];
}

type ModalView = 'main' | 'datePicker';

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function IrlGatheringModal({ isOpen, onClose, notification, onGoingClick }: IrlGatheringModalProps) {
  const [currentView, setCurrentView] = useState<ModalView>('main');
  const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null);

  const methods = useForm<IrlGatheringFormData>({
    defaultValues: {
      topics: [],
    },
  });

  const metadata = (notification.metadata || {}) as unknown as Partial<IrlGatheringMetadata>;

  // Extract data from typed metadata
  const gatheringName = metadata.location?.name || notification.title;
  const gatheringImage = metadata.events?.items?.[0]?.logoUrl || undefined;
  const aboutDescription = notification.description || '';
  const dateRange = metadata.events?.dates
    ? formatDateRange(metadata.events.dates.start, metadata.events.dates.end)
    : 'TBD';
  const locationName = metadata.location?.name || 'TBD';
  const eventsCount = metadata.events?.total || 0;
  const attendees = (metadata.attendees?.topAttendees || []).map((a) => ({
    uid: a.memberUid,
    picture: a.imageUrl || undefined,
  }));
  const attendeesCount = metadata.attendees?.total || 0;
  const planningQuestion = `Are you planning to be in ${locationName}?`;

  // These fields are not in the current metadata structure - keeping as placeholders
  const telegramLink = undefined;
  const eventsLink = undefined;
  const speakerIntakeLink = undefined;
  const submittedEventsCount = 0;
  const submitEventLink = undefined;
  const otherResourcesLink = undefined;

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

  const handleSubmit = methods.handleSubmit((data) => {
    console.log('IRL Gathering Form Submitted:', {
      dateRange: selectedDateRange,
      topics: data.topics,
    });
    onGoingClick?.();
  });

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
    <Modal isOpen={isOpen} onClose={onClose} overlayClassname={s.modalOverlay}>
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit}
          className={s.modal}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
        >
          <ModalHeader gatheringName={gatheringName} gatheringImage={gatheringImage} onClose={onClose} />

          <div className={s.content}>
            <AboutSection description={aboutDescription} />

            <GatheringDetails
              dateRange={dateRange}
              location={locationName}
              telegramLink={telegramLink}
              eventsLink={eventsLink}
              eventsCount={eventsCount}
              speakerIntakeLink={speakerIntakeLink}
              submitEventLink={submitEventLink}
              submittedEventsCount={submittedEventsCount}
              otherResourcesLink={otherResourcesLink}
            />

            <AttendeesSection
              attendees={attendees}
              attendeesCount={attendeesCount}
              gatheringLink={`/events/irl?location=${locationName}`}
            />

            <PlanningSection
              planningQuestion={planningQuestion}
              selectedDateRange={selectedDateRange}
              onInputClick={handleOpenDatePicker}
            />
          </div>

          <ModalFooter onClose={onClose} isSubmit />
        </form>
      </FormProvider>
    </Modal>
  );
}
