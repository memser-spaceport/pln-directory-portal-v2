'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
  InfoBanner,
} from './components';
import { useIrlGatheringModal, useIrlGatheringData, useIrlGatheringSubmit } from './hooks';
import { buildGatheringLink } from './helpers';
import { IrlGatheringModalProps, IrlGatheringFormData, EventRoleSelection } from './types';
import { EVENTS } from '@/utils/constants';
import s from './IrlGatheringModal.module.scss';
// import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { useMember } from '@/services/members/hooks/useMember';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { getMember } from '@/services/members.service';
import { ITeam } from '@/types/teams.types';

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
  const isLoggedIn = !!userInfo?.uid;
  const defaultTeamUid = userInfo?.leadingTeams?.[0];
  const isRestrictedAccess = userInfo?.accessLevel === 'L0' || userInfo?.accessLevel === 'L1';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // const { data } = useMemberFormOptions();
  const { data: memberData } = useMember(userInfo?.uid);
  const analytics = useIrlAnalytics();
  const wasOpenRef = useRef(false);
  const [shouldAnimateLoginButton, setShouldAnimateLoginButton] = useState(false);
  const [step, setStep] = useState<1 | 2>(isEditMode ? 2 : 1);
  const [createdGuestUid, setCreatedGuestUid] = useState<string | null>(null);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  const { data: member } = useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, userInfo?.uid, !!userInfo, userInfo?.uid],
    queryFn: () =>
      getMember(
        userInfo?.uid,
        { with: 'image,skills,location,teamMemberRoles.team' },
        !!userInfo,
        userInfo,
        true,
        true,
      ),
    enabled: !!userInfo?.uid,
    select: (data) => data?.data?.formattedData,
  });

  // Build initial form values for edit mode
  const initialFormValues = useMemo(() => {
    if (!isEditMode || !editModeData) {
      // Prefill with member data if available
      const mainTeam = member?.teams?.find((team: ITeam) => team.mainTeam === true);
      const selectedTeam = mainTeam && mainTeam.name ? { value: mainTeam.id, label: mainTeam.name } : undefined;

      const telegramHandle = memberData?.memberInfo?.telegramHandler
        ? memberData.memberInfo.telegramHandler.startsWith('@')
          ? memberData.memberInfo.telegramHandler
          : `@${memberData.memberInfo.telegramHandler}`
        : '';

      const officeHours = memberData?.memberInfo?.officeHours || '';

      return {
        topics: [],
        selectedEventUids: [],
        eventRoles: [],
        additionalDetails: '',
        selectedTeam,
        telegramHandle,
        officeHours,
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
  }, [
    isEditMode,
    editModeData,
    member?.teams,
    memberData?.memberInfo?.telegramHandler,
    memberData?.memberInfo?.officeHours,
  ]);

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

  // Reset form and step when modal opens
  useEffect(() => {
    if (isOpen) {
      methods.reset(initialFormValues);
      setStep(isEditMode ? 2 : 1);
      setCreatedGuestUid(null);
    }
  }, [isOpen, methods, initialFormValues, isEditMode]);

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
    onClose();
    setTimeout(() => {
      onGoingClick?.();
    }, 700);
  }, [onGoingClick, onClose]);

  const handleLoginClick = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('open-modal', 'true');
    const newUrl = `${pathname}?${params.toString()}#login`;
    router.push(newUrl, { scroll: false });
  }, [pathname, searchParams, router]);

  const handleDisabledFieldClick = useCallback(() => {
    if (!isLoggedIn) {
      setShouldAnimateLoginButton(true);
      setTimeout(() => {
        setShouldAnimateLoginButton(false);
      }, 1000);
    }
  }, [isLoggedIn]);

  const isEffectiveEditMode = isEditMode || !!createdGuestUid;
  const effectiveGuestUid = editModeData?.guestUid || createdGuestUid || undefined;

  const {
    handleSubmit: submitForm,
    handleFirstStepSubmit: firstStepSubmit,
    isPending,
  } = useIrlGatheringSubmit({
    gatheringData,
    selectedDateRange,
    onSuccess: handleSuccess,
    isEditMode: isEffectiveEditMode,
    guestUid: effectiveGuestUid,
  });

  const handleFormSubmit = methods.handleSubmit((data) => {
    analytics.trackGatheringModalSubmitClicked(gatheringData, isEditMode);
    submitForm(data);
  });

  // Save/restore scroll position when switching to/from picker views
  const saveScrollPosition = useCallback(() => {
    scrollPositionRef.current = contentRef.current?.scrollTop ?? 0;
  }, []);

  const restoreScrollPosition = useCallback(() => {
    requestAnimationFrame(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = scrollPositionRef.current;
      }
    });
  }, []);

  // Wrapped handlers with analytics tracking and scroll preservation
  const handleOpenDatePickerWithTracking = useCallback(() => {
    saveScrollPosition();
    analytics.trackGatheringModalDatePickerOpened(gatheringData);
    handleOpenDatePicker();
  }, [saveScrollPosition, analytics, gatheringData, handleOpenDatePicker]);

  const handleDatePickerCancelWithTracking = useCallback(() => {
    analytics.trackGatheringModalDatePickerCancelled(gatheringData);
    handleDatePickerCancel();
    restoreScrollPosition();
  }, [analytics, gatheringData, handleDatePickerCancel, restoreScrollPosition]);

  const handleDatePickerApplyWithTracking = useCallback(
    (range: [Date, Date] | null) => {
      analytics.trackGatheringModalDatePickerApplied(gatheringData, range);
      handleDatePickerApply(range);
      restoreScrollPosition();
    },
    [analytics, gatheringData, handleDatePickerApply, restoreScrollPosition],
  );

  const handleOpenTopicsPickerWithTracking = useCallback(() => {
    saveScrollPosition();
    analytics.trackGatheringModalTopicsPickerOpened(gatheringData);
    handleOpenTopicsPicker();
  }, [saveScrollPosition, analytics, gatheringData, handleOpenTopicsPicker]);

  const handleTopicsPickerCancelWithTracking = useCallback(() => {
    analytics.trackGatheringModalTopicsPickerCancelled(gatheringData);
    handleTopicsPickerCancel();
    restoreScrollPosition();
  }, [analytics, gatheringData, handleTopicsPickerCancel, restoreScrollPosition]);

  const handleTopicsApply = useCallback(
    (topics: string[]) => {
      analytics.trackGatheringModalTopicsPickerApplied(gatheringData, topics);
      handleTopicsPickerApply(topics, (t) => methods.setValue('topics', t));
      restoreScrollPosition();
    },
    [analytics, gatheringData, handleTopicsPickerApply, methods, restoreScrollPosition],
  );

  const handleOpenEventsPickerWithTracking = useCallback(() => {
    saveScrollPosition();
    analytics.trackGatheringModalEventsPickerOpened(gatheringData);
    handleOpenEventsPicker();
  }, [saveScrollPosition, analytics, gatheringData, handleOpenEventsPicker]);

  const handleEventsPickerCancelWithTracking = useCallback(() => {
    analytics.trackGatheringModalEventsPickerCancelled(gatheringData);
    handleEventsPickerCancel();
    restoreScrollPosition();
  }, [analytics, gatheringData, handleEventsPickerCancel, restoreScrollPosition]);

  const handleEventsApply = useCallback(
    (uids: string[], roles: EventRoleSelection[]) => {
      analytics.trackGatheringModalEventsPickerApplied(gatheringData, uids);
      handleEventsPickerApply(
        uids,
        roles,
        (u) => methods.setValue('selectedEventUids', u),
        (r) => methods.setValue('eventRoles', r),
      );
      restoreScrollPosition();
    },
    [analytics, gatheringData, handleEventsPickerApply, methods, restoreScrollPosition],
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
          timezone={gatheringData.timezone}
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

          <div ref={contentRef} className={s.content}>
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

            {step === 1 && userInfo.accessLevel !== 'L0' && userInfo.accessLevel !== 'L1' && (
              <div>
                <div className={s.step1Title}>Are you going to {gatheringData.gatheringName}?</div>
                <div className={s.step1Subtitle}>Let others know if you’ll be around and what you’re interested in</div>
              </div>
            )}

            {step === 2 && (
              <>
                <PlanningSection
                  planningQuestion={gatheringData.planningQuestion}
                  selectedDateRange={selectedDateRange}
                  selectedTopics={selectedTopics}
                  selectedEvents={selectedEvents}
                  events={gatheringData.events}
                  onDateInputClick={handleOpenDatePickerWithTracking}
                  onTopicsInputClick={handleOpenTopicsPickerWithTracking}
                  onEventsInputClick={handleOpenEventsPickerWithTracking}
                  isLoggedIn={isLoggedIn}
                  onDisabledFieldClick={handleDisabledFieldClick}
                />

                {isLoggedIn && (
                  <AdditionalDetailsSection
                    teams={member?.teams || []}
                    defaultTeamUid={defaultTeamUid}
                    telegramHandle={memberData?.memberInfo?.telegramHandler}
                    officeHours={memberData?.memberInfo?.officeHours}
                    defaultExpanded={false}
                  />
                )}
              </>
            )}
          </div>

          {isRestrictedAccess ? (
            <div className={s.infoBannerWrapper}>
              <InfoBanner />
            </div>
          ) : step === 1 ? (
            <div className={s.footer}>
              <button type="button" className={s.cancelButton} onClick={onClose}>
                {isLoggedIn ? 'No' : 'Cancel'}
              </button>
              <button
                type="button"
                className={`${s.goingButton} ${shouldAnimateLoginButton ? s.goingButtonAnimate : ''}`}
                disabled={isPending}
                onClick={() => {
                  if (isLoggedIn) {
                    analytics.trackGatheringModalYesImGoingClicked(gatheringData);
                    const formData = methods.getValues();
                    firstStepSubmit(formData, (guestUid) => {
                      setCreatedGuestUid(guestUid);
                      setStep(2);
                      startRefreshTransition(() => {
                        router.refresh();
                      });
                      document.dispatchEvent(new CustomEvent(EVENTS.REFRESH_ATTENDEES_LIST));
                    });
                  } else {
                    if (gatheringData) {
                      analytics.trackGatheringModalLoginToRespondClicked(gatheringData);
                    }
                    handleLoginClick();
                  }
                }}
              >
                {isLoggedIn ? (isPending ? 'Processing...' : "Yes, I'm going") : 'Log in to Respond'}
              </button>
            </div>
          ) : (
            <ModalFooter
              onClose={onClose}
              isSubmit={isLoggedIn}
              isLoading={isPending}
              isDisabled={isRefreshing}
              isEditMode={isEditMode}
              isLoggedIn={isLoggedIn}
              onLoginClick={handleLoginClick}
              shouldAnimate={shouldAnimateLoginButton}
              gatheringData={gatheringData}
            />
          )}
        </form>
      </FormProvider>
    </Modal>
  );
}
