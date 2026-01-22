import { useState, useCallback, useEffect, useRef } from 'react';
import { ModalView, EventRoleSelection } from '../types';

interface UseIrlGatheringModalParams {
  initialDateRange?: [Date, Date] | null;
  initialTopics?: string[];
  isOpen?: boolean;
}

interface UseIrlGatheringModalReturn {
  currentView: ModalView;
  selectedDateRange: [Date, Date] | null;
  selectedTopics: string[];
  handleOpenDatePicker: () => void;
  handleDatePickerCancel: () => void;
  handleDatePickerApply: (range: [Date, Date] | null) => void;
  handleOpenTopicsPicker: () => void;
  handleTopicsPickerCancel: () => void;
  handleTopicsPickerApply: (topics: string[], setFormTopics: (topics: string[]) => void) => void;
  handleOpenEventsPicker: () => void;
  handleEventsPickerCancel: () => void;
  handleEventsPickerApply: (
    selectedEventUids: string[],
    eventRoles: EventRoleSelection[],
    setFormEvents: (uids: string[]) => void,
    setFormRoles: (roles: EventRoleSelection[]) => void,
  ) => void;
}

/**
 * Hook for managing IRL Gathering modal view state and navigation
 * Handles switching between main view, date picker, and topics picker
 */
export function useIrlGatheringModal(params?: UseIrlGatheringModalParams): UseIrlGatheringModalReturn {
  const [currentView, setCurrentView] = useState<ModalView>('main');
  const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(params?.initialDateRange ?? null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(params?.initialTopics ?? []);
  const wasOpenRef = useRef(false);

  // Serialize date range for stable comparison
  const initialDateRangeKey = params?.initialDateRange
    ? `${params.initialDateRange[0].getTime()}-${params.initialDateRange[1].getTime()}`
    : 'null';
  const initialTopicsKey = params?.initialTopics?.join(',') ?? '';

  // Store refs to avoid stale closures
  const initialDateRangeRef = useRef(params?.initialDateRange);
  const initialTopicsRef = useRef(params?.initialTopics);
  initialDateRangeRef.current = params?.initialDateRange;
  initialTopicsRef.current = params?.initialTopics;

  // Reset state when modal opens with new initial values
  useEffect(() => {
    // Only reset when modal transitions from closed to open
    if (params?.isOpen && !wasOpenRef.current) {
      setCurrentView('main');
      setSelectedDateRange(initialDateRangeRef.current ?? null);
      setSelectedTopics(initialTopicsRef.current ?? []);
    }
    wasOpenRef.current = params?.isOpen ?? false;
  }, [params?.isOpen, initialDateRangeKey, initialTopicsKey]);

  const handleOpenDatePicker = useCallback(() => {
    setCurrentView('datePicker');
  }, []);

  const handleDatePickerCancel = useCallback(() => {
    setCurrentView('main');
  }, []);

  const handleDatePickerApply = useCallback((range: [Date, Date] | null) => {
    setSelectedDateRange(range);
    setCurrentView('main');
  }, []);

  const handleOpenTopicsPicker = useCallback(() => {
    setCurrentView('topicsPicker');
  }, []);

  const handleTopicsPickerCancel = useCallback(() => {
    setCurrentView('main');
  }, []);

  const handleTopicsPickerApply = useCallback(
    (topics: string[], setFormTopics: (topics: string[]) => void) => {
      setSelectedTopics(topics);
      setFormTopics(topics);
      setCurrentView('main');
    },
    [],
  );

  const handleOpenEventsPicker = useCallback(() => {
    setCurrentView('eventsPicker');
  }, []);

  const handleEventsPickerCancel = useCallback(() => {
    setCurrentView('main');
  }, []);

  const handleEventsPickerApply = useCallback(
    (
      selectedEventUids: string[],
      eventRoles: EventRoleSelection[],
      setFormEvents: (uids: string[]) => void,
      setFormRoles: (roles: EventRoleSelection[]) => void,
    ) => {
      setFormEvents(selectedEventUids);
      setFormRoles(eventRoles);
      setCurrentView('main');
    },
    [],
  );

  return {
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
  };
}

