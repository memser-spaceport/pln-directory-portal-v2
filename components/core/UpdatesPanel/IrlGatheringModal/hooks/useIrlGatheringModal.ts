import { useState, useCallback, useEffect } from 'react';
import { ModalView } from '../types';

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
}

/**
 * Hook for managing IRL Gathering modal view state and navigation
 * Handles switching between main view, date picker, and topics picker
 */
export function useIrlGatheringModal(params?: UseIrlGatheringModalParams): UseIrlGatheringModalReturn {
  const [currentView, setCurrentView] = useState<ModalView>('main');
  const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(params?.initialDateRange ?? null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(params?.initialTopics ?? []);

  // Reset state when modal opens with new initial values
  useEffect(() => {
    if (params?.isOpen) {
      setCurrentView('main');
      setSelectedDateRange(params?.initialDateRange ?? null);
      setSelectedTopics(params?.initialTopics ?? []);
    }
  }, [params?.isOpen, params?.initialDateRange, params?.initialTopics]);

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
  };
}

