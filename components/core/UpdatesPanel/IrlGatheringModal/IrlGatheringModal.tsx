'use client';

import { useCallback, useEffect, useMemo } from 'react';
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
  ModalFooter,
  DatePickerView,
  TopicsPickerView,
} from './components';
import { useIrlGatheringModal, useIrlGatheringData, useIrlGatheringSubmit } from './hooks';
import { buildGatheringLink } from './helpers';
import { IrlGatheringModalProps, IrlGatheringFormData, EventRoleSelection } from './types';
import s from './IrlGatheringModal.module.scss';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { useMember } from '@/services/members/hooks/useMember';

export type { IrlGatheringModalProps, IrlGatheringFormData } from './types';

export function IrlGatheringModal({
  isOpen,
  onClose,
  notification,
  onGoingClick,
  isEditMode = false,
  editModeData,
}: IrlGatheringModalProps) {
  const gatheringData = useIrlGatheringData(notification);
  const { userInfo } = getCookiesFromClient();
  const defaultTeamUid = userInfo?.leadingTeams?.[0];
  const { data } = useMemberFormOptions();
  const { data: memberData } = useMember(userInfo?.uid);

  // Build initial form values for edit mode
  const initialFormValues = useMemo(() => {
    if (!isEditMode || !editModeData) {
      return {
        topics: [],
        selectedEventUids: [],
        eventRoles: [],
        additionalDetails: '',
        selectedTeam: undefined,
        telegramHandle: '',
        officeHours: '',
      };
    }

    // Build selected team option
    const selectedTeam =
      editModeData.teamUid && editModeData.teamName
        ? { value: editModeData.teamUid, label: editModeData.teamName }
        : undefined;

    // Build selected event UIDs and roles
    const selectedEventUids = editModeData.events?.map((e) => e.uid) || [];
    const eventRoles: EventRoleSelection[] =
      editModeData.events?.map((e) => {
        const roles: ('Attendee' | 'Speaker' | 'Host')[] = ['Attendee'];
        if (e.isHost) roles.push('Host');
        if (e.isSpeaker) roles.push('Speaker');
        return { eventUid: e.uid, roles };
      }) || [];

    return {
      topics: editModeData.topics || [],
      selectedEventUids,
      eventRoles,
      additionalDetails: editModeData.reason || '',
      selectedTeam,
      telegramHandle: editModeData.telegramId || '',
      officeHours: editModeData.officeHours || '',
    };
  }, [isEditMode, editModeData]);

  // Build initial date range for edit mode
  const initialDateRange = useMemo((): [Date, Date] | null => {
    if (!isEditMode || !editModeData?.additionalInfo) return null;
    const { checkInDate, checkOutDate } = editModeData.additionalInfo;
    if (!checkInDate || !checkOutDate) return null;
    return [new Date(checkInDate), new Date(checkOutDate)];
  }, [isEditMode, editModeData]);

  const methods = useForm<IrlGatheringFormData>({
    defaultValues: initialFormValues,
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      methods.reset(initialFormValues);
    }
  }, [isOpen, initialFormValues, methods]);

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
  } = useIrlGatheringModal({
    initialDateRange,
    initialTopics: isEditMode ? editModeData?.topics : undefined,
    isOpen,
  });

  const handleSuccess = useCallback(() => {
    onGoingClick?.();
    onClose();
  }, [onGoingClick, onClose]);

  const { handleSubmit: submitForm, isPending } = useIrlGatheringSubmit({
    gatheringData,
    selectedDateRange,
    onSuccess: handleSuccess,
    isEditMode,
    guestUid: editModeData?.guestUid,
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

            <AdditionalDetailsSection
              teams={data?.teams || []}
              defaultTeamUid={defaultTeamUid}
              telegramHandle={memberData?.memberInfo?.telegramHandle}
              officeHours={memberData?.memberInfo?.officeHours}
              defaultExpanded={false}
            />
          </div>

          <ModalFooter onClose={onClose} isSubmit isLoading={isPending} isEditMode={isEditMode} />
        </form>
      </FormProvider>
    </Modal>
  );
}
