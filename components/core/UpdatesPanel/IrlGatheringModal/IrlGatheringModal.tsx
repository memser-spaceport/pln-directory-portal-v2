'use client';

import { useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Modal } from '@/components/common/Modal/Modal';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import {
  ModalHeader,
  AboutSection,
  GatheringDetails,
  AttendeesSection,
  EventsSection,
  PlanningSection,
  AdditionalDetailsSection,
  ContactInfoSection,
  ModalFooter,
  DatePickerView,
  TopicsPickerView,
} from './components';
import { useIrlGatheringModal, useIrlGatheringData, useIrlGatheringSubmit } from './hooks';
import { buildGatheringLink } from './helpers';
import { IrlGatheringModalProps, IrlGatheringFormData } from './types';
import s from './IrlGatheringModal.module.scss';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { useMember } from '@/services/members/hooks/useMember';

export type { IrlGatheringModalProps, IrlGatheringFormData } from './types';

export function IrlGatheringModal({ isOpen, onClose, notification, onGoingClick }: IrlGatheringModalProps) {
  const gatheringData = useIrlGatheringData(notification);
  const { userInfo } = getCookiesFromClient();
  const defaultTeamUid = userInfo?.leadingTeams?.[0];
  const { data } = useMemberFormOptions();
  const { data: memberData } = useMember(userInfo?.uid);

  const methods = useForm<IrlGatheringFormData>({
    defaultValues: {
      topics: [],
      selectedEventUids: [],
      eventRoles: [],
      additionalDetails: '',
      selectedTeam: undefined,
      telegramHandle: '',
      officeHours: '',
    },
  });

  const {
    currentView,
    selectedDateRange,
    selectedTopics,
    handleOpenDatePicker,
    handleDatePickerCancel,
    handleDatePickerApply,
    handleOpenTopicsPicker,
    handleTopicsPickerCancel,
    handleTopicsPickerApply,
  } = useIrlGatheringModal();

  const handleSuccess = useCallback(() => {
    onGoingClick?.();
    onClose();
  }, [onGoingClick, onClose]);

  const { handleSubmit: submitForm, isPending } = useIrlGatheringSubmit({
    gatheringData,
    selectedDateRange,
    onSuccess: handleSuccess,
  });

  const handleFormSubmit = methods.handleSubmit(submitForm);

  const handleTopicsApply = useCallback(
    (topics: string[]) => {
      handleTopicsPickerApply(topics, (t) => methods.setValue('topics', t));
    },
    [handleTopicsPickerApply, methods],
  );

  if (currentView === 'datePicker') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} overlayClassname={s.modalOverlay}>
        <DatePickerView
          planningQuestion={gatheringData.planningQuestion}
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
          planningQuestion={gatheringData.planningQuestion}
          initialTopics={selectedTopics}
          onCancel={handleTopicsPickerCancel}
          onApply={handleTopicsApply}
        />
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} overlayClassname={s.modalOverlay}>
      <FormProvider {...methods}>
        <form
          onSubmit={handleFormSubmit}
          className={s.modal}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
        >
          <ModalHeader
            gatheringName={gatheringData.gatheringName}
            gatheringImage={gatheringData.gatheringImage}
            onClose={onClose}
          />

          <div className={s.content}>
            <AboutSection description={gatheringData.aboutDescription} />

            <GatheringDetails
              dateRange={gatheringData.dateRange}
              location={gatheringData.locationName}
              eventsLink={gatheringData.eventsLink}
              eventsCount={gatheringData.eventsCount}
              resources={gatheringData.resources}
            />

            <AttendeesSection
              attendees={gatheringData.attendees}
              attendeesCount={gatheringData.attendeesCount}
              gatheringLink={buildGatheringLink(gatheringData.locationName)}
            />

            <PlanningSection
              planningQuestion={gatheringData.planningQuestion}
              selectedDateRange={selectedDateRange}
              selectedTopics={selectedTopics}
              onDateInputClick={handleOpenDatePicker}
              onTopicsInputClick={handleOpenTopicsPicker}
            />

            <EventsSection events={gatheringData.events} locationName={gatheringData.locationName} />

            <AdditionalDetailsSection teams={data?.teams || []} defaultTeamUid={defaultTeamUid} />

            <ContactInfoSection
              telegramHandle={memberData?.memberInfo?.telegramHandle}
              officeHours={memberData?.memberInfo?.officeHours}
            />
          </div>

          <ModalFooter onClose={onClose} isSubmit isLoading={isPending} />
        </form>
      </FormProvider>
    </Modal>
  );
}
