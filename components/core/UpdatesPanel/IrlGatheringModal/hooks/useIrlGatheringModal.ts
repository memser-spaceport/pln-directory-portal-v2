import { useState, useCallback } from 'react';
import { ModalView } from '../types';

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
export function useIrlGatheringModal(): UseIrlGatheringModalReturn {
  const [currentView, setCurrentView] = useState<ModalView>('main');
  const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

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

