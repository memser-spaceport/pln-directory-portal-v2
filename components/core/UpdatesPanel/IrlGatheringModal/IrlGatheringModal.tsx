'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
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
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { getMember } from '@/services/members.service';

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
  const analytics = useIrlAnalytics();
  const wasOpenRef = useRef(false);

  const { data: member } = useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, userInfo.uid, !!userInfo, userInfo.uid],
    queryFn: () =>
      getMember(userInfo.uid, { with: 'image,skills,location,teamMemberRoles.team' }, !!userInfo, userInfo, true, true),
    enabled: !!userInfo.uid,
    select: (data) => data?.data?.formattedData,
  });

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
        const roles: ('Attendee' | 'Speaker' | 'Host' | 'Sponsor')[] = ['Attendee'];
        if (e.isHost) roles.push('Host');
        if (e.isSpeaker) roles.push('Speaker');
        if (e.isSponsor) roles.push('Sponsor');

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

  // Track modal open/close
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      analytics.trackGatheringModalOpened(gatheringData, isEditMode);
    } else if (!isOpen && wasOpenRef.current) {
      analytics.trackGatheringModalClosed(gatheringData, isEditMode);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, gatheringData, isEditMode, analytics]);

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

  const handleFormSubmit = methods.handleSubmit((data) => {
    analytics.trackGatheringModalSubmitClicked(gatheringData, isEditMode);
    submitForm(data);
  });

  // Wrapped handlers with analytics tracking
  const handleOpenDatePickerWithTracking = useCallback(() => {
    analytics.trackGatheringModalDatePickerOpened(gatheringData);
    handleOpenDatePicker();
  }, [analytics, gatheringData, handleOpenDatePicker]);

  const handleDatePickerCancelWithTracking = useCallback(() => {
    analytics.trackGatheringModalDatePickerCancelled(gatheringData);
    handleDatePickerCancel();
  }, [analytics, gatheringData, handleDatePickerCancel]);

  const handleDatePickerApplyWithTracking = useCallback(
    (range: [Date, Date] | null) => {
      analytics.trackGatheringModalDatePickerApplied(gatheringData, range);
      handleDatePickerApply(range);
    },
    [analytics, gatheringData, handleDatePickerApply],
  );

  const handleOpenTopicsPickerWithTracking = useCallback(() => {
    analytics.trackGatheringModalTopicsPickerOpened(gatheringData);
    handleOpenTopicsPicker();
  }, [analytics, gatheringData, handleOpenTopicsPicker]);

  const handleTopicsPickerCancelWithTracking = useCallback(() => {
    analytics.trackGatheringModalTopicsPickerCancelled(gatheringData);
    handleTopicsPickerCancel();
  }, [analytics, gatheringData, handleTopicsPickerCancel]);

  const handleTopicsApply = useCallback(
    (topics: string[]) => {
      analytics.trackGatheringModalTopicsPickerApplied(gatheringData, topics);
      handleTopicsPickerApply(topics, (t) => methods.setValue('topics', t));
    },
    [analytics, gatheringData, handleTopicsPickerApply, methods],
  );

  const handleOpenEventsPickerWithTracking = useCallback(() => {
    analytics.trackGatheringModalEventsPickerOpened(gatheringData);
    handleOpenEventsPicker();
  }, [analytics, gatheringData, handleOpenEventsPicker]);

  const handleEventsPickerCancelWithTracking = useCallback(() => {
    analytics.trackGatheringModalEventsPickerCancelled(gatheringData);
    handleEventsPickerCancel();
  }, [analytics, gatheringData, handleEventsPickerCancel]);

  const handleEventsApply = useCallback(
    (uids: string[], roles: EventRoleSelection[]) => {
      analytics.trackGatheringModalEventsPickerApplied(gatheringData, uids);
      handleEventsPickerApply(
        uids,
        roles,
        (u) => methods.setValue('selectedEventUids', u),
        (r) => methods.setValue('eventRoles', r),
      );
    },
    [analytics, gatheringData, handleEventsPickerApply, methods],
  );

  if (currentView === 'datePicker') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} overlayClassname={s.modalOverlay}>
        <DatePickerView
          planningQuestion={gatheringData.planningQuestion}
          initialRange={selectedDateRange}
          onCancel={handleDatePickerCancelWithTracking}
          onApply={handleDatePickerApplyWithTracking}
          gatheringDateRange={gatheringData.eventDates}
          onClear={() => analytics.trackGatheringModalDatePickerCleared(gatheringData)}
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
          onCancel={handleTopicsPickerCancelWithTracking}
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
          onCancel={handleEventsPickerCancelWithTracking}
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
              onDateInputClick={handleOpenDatePickerWithTracking}
              onTopicsInputClick={handleOpenTopicsPickerWithTracking}
              onEventsInputClick={handleOpenEventsPickerWithTracking}
            />

            <AdditionalDetailsSection
              teams={member?.teams || []}
              defaultTeamUid={defaultTeamUid}
              telegramHandle={memberData?.memberInfo?.telegramHandler}
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
