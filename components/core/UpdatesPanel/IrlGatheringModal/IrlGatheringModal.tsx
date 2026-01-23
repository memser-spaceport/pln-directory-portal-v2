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
  PlanningSection,
  AdditionalDetailsSection,
  ModalFooter,
  DatePickerView,
  TopicsPickerView,
  EventsPickerView,
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
        const roles: ('Attendee' | 'Speaker' | 'Host' | 'Sponsor')[] = [];
        if (e.isHost) roles.push('Host');
        if (e.isSpeaker) roles.push('Speaker');
        if (e.isSponsor) roles.push('Sponsor');

        if (roles.length === 0) roles.push('Attendee');

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
    handleOpenEventsPicker,
    handleEventsPickerCancel,
    handleEventsPickerApply,
  } = useIrlGatheringModal({
    initialDateRange,
    initialTopics: isEditMode ? editModeData?.topics : undefined,
    isOpen,
  });

  // Watch selected events from form
  const selectedEventUids = methods.watch('selectedEventUids') || [];
  const eventRoles = methods.watch('eventRoles') || [];

  // Build selected events info for display in PlanningSection
  const selectedEvents = useMemo(() => {
    return selectedEventUids
      .map((uid) => {
        const event = gatheringData.events.find((e) => e.uid === uid);
        return event ? { uid: event.uid, name: event.name } : null;
      })
      .filter((e): e is { uid: string; name: string } => e !== null);
  }, [selectedEventUids, gatheringData.events]);

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

  const handleEventsApply = useCallback(
    (uids: string[], roles: EventRoleSelection[]) => {
      handleEventsPickerApply(
        uids,
        roles,
        (u) => methods.setValue('selectedEventUids', u),
        (r) => methods.setValue('eventRoles', r),
      );
    },
    [handleEventsPickerApply, methods],
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

  if (currentView === 'eventsPicker') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} overlayClassname={s.modalOverlay}>
        <EventsPickerView
          planningQuestion={gatheringData.planningQuestion}
          locationName={gatheringData.locationName}
          events={gatheringData.events}
          initialSelectedEventUids={selectedEventUids}
          initialEventRoles={eventRoles}
          onCancel={handleEventsPickerCancel}
          onApply={handleEventsApply}
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
            {gatheringData.aboutDescription && <AboutSection description={gatheringData.aboutDescription} />}

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
              selectedEvents={selectedEvents}
              events={gatheringData.events}
              onDateInputClick={handleOpenDatePicker}
              onTopicsInputClick={handleOpenTopicsPicker}
              onEventsInputClick={handleOpenEventsPicker}
            />

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
