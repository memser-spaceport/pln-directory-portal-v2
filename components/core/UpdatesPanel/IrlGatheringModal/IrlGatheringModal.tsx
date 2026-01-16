'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Modal } from '@/components/common/Modal/Modal';
import { PushNotification, IrlGatheringMetadata } from '@/types/push-notifications.types';
import { useCreateIrlGatheringGuest } from '@/services/events/hooks/useCreateIrlGatheringGuest';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { toast } from '@/components/core/ToastContainer';
import {
  ModalHeader,
  AboutSection,
  GatheringDetails,
  AttendeesSection,
  PlanningSection,
  ModalFooter,
  DatePickerView,
  TopicsPickerView,
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

type ModalView = 'main' | 'datePicker' | 'topicsPicker';

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function IrlGatheringModal({ isOpen, onClose, notification, onGoingClick }: IrlGatheringModalProps) {
  const [currentView, setCurrentView] = useState<ModalView>('main');
  const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const { mutate: createGuest, isPending } = useCreateIrlGatheringGuest();
  const { userInfo } = getCookiesFromClient();

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
  const telegramLink = metadata.events?.items?.[0]?.telegramId;
  const eventsLink = `/events/irl?location=${locationName}`;
  const speakerIntakeLink = undefined;
  const submittedEventsCount = metadata.events?.total;
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

  const handleOpenTopicsPicker = () => {
    setCurrentView('topicsPicker');
  };

  const handleTopicsPickerCancel = () => {
    setCurrentView('main');
  };

  const handleTopicsPickerApply = (topics: string[]) => {
    setSelectedTopics(topics);
    methods.setValue('topics', topics);
    setCurrentView('main');
  };

  const handleSubmit = methods.handleSubmit((data) => {
    if (!userInfo?.uid || !metadata.gatheringUid) {
      console.error('Missing required data for submission');
      return;
    }

    // Use selected date range or fall back to event dates from metadata
    const checkInDate = selectedDateRange
      ? formatDateForApi(selectedDateRange[0])
      : metadata.events?.dates?.start
        ? formatDateForApi(new Date(metadata.events?.dates?.start))
        : '';
    const checkOutDate = selectedDateRange
      ? formatDateForApi(selectedDateRange[1])
      : metadata.events?.dates?.end
        ? formatDateForApi(new Date(metadata.events?.dates?.end))
        : '';

    const payload = {
      memberUid: userInfo.uid,
      teamUid: userInfo.leadingTeams?.[0] || '',
      reason: '',
      telegramId: '',
      officeHours: '',
      events: [],
      additionalInfo: {
        checkInDate,
        checkOutDate,
      },
      topics: data.topics,
      locationName: locationName,
    };

    createGuest(
      {
        locationId: metadata.gatheringUid,
        payload,
        type: 'upcoming',
      },
      {
        onSuccess: () => {
          toast.success(`You're going to ${locationName}!`);
          onGoingClick?.();
          onClose();
        },
        onError: (error) => {
          console.error('Failed to create IRL gathering guest:', error);
          toast.error(error?.message ?? 'Failed to register for the gathering. Please try again.');
        },
      },
    );
  });

  if (currentView === 'datePicker') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} overlayClassname={s.modalOverlay}>
        <DatePickerView
          planningQuestion={planningQuestion}
          initialRange={selectedDateRange}
          onCancel={handleDatePickerCancel}
          onApply={handleDatePickerApply}
        />
      </Modal>
    );
  }

  if (currentView === 'topicsPicker') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} overlayClassname={s.modalOverlay}>
        <TopicsPickerView
          planningQuestion={planningQuestion}
          initialTopics={selectedTopics}
          onCancel={handleTopicsPickerCancel}
          onApply={handleTopicsPickerApply}
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
              selectedTopics={selectedTopics}
              onDateInputClick={handleOpenDatePicker}
              onTopicsInputClick={handleOpenTopicsPicker}
            />
          </div>

          <ModalFooter onClose={onClose} isSubmit isLoading={isPending} />
        </form>
      </FormProvider>
    </Modal>
  );
}
