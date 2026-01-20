'use client';

import { useState, useMemo, KeyboardEvent } from 'react';
import { IRL_DEFAULT_TOPICS } from '@/utils/constants';
import s from '../IrlGatheringModal.module.scss';

interface TopicsPickerViewProps {
  planningQuestion: string;
  initialTopics: string[];
  onCancel: () => void;
  onApply: (topics: string[]) => void;
}

const ALL_TOPICS = IRL_DEFAULT_TOPICS.split(',').map((t) => t.trim());

export function TopicsPickerView({ planningQuestion, initialTopics, onCancel, onApply }: TopicsPickerViewProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initialTopics);
  const [searchValue, setSearchValue] = useState('');

  const filteredTopics = useMemo(() => {
    if (!searchValue.trim()) {
      return ALL_TOPICS;
    }
    const lowerSearch = searchValue.toLowerCase();
    return ALL_TOPICS.filter((topic) => topic.toLowerCase().includes(lowerSearch));
  }, [searchValue]);

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  };

  const handleRemoveTopic = (topic: string) => {
    setSelectedTopics((prev) => prev.filter((t) => t !== topic));
  };

  const handleAddCustomTopic = () => {
    const trimmedValue = searchValue.trim();
    if (trimmedValue && !selectedTopics.includes(trimmedValue)) {
      setSelectedTopics((prev) => [...prev, trimmedValue]);
      setSearchValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTopic();
    } else if (e.key === 'Backspace' && !searchValue && selectedTopics.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      setSelectedTopics((prev) => prev.slice(0, -1));
    }
  };

  const handleApply = () => {
    onApply(selectedTopics);
  };

  // Check if current search value is a custom topic (not in predefined list)
  const isCustomTopic = searchValue.trim() && !ALL_TOPICS.some(
    (t) => t.toLowerCase() === searchValue.trim().toLowerCase()
  );

  return (
    <div className={s.topicsPickerModal}>
      <div className={s.topicsPickerContent}>
        <h3 className={s.sectionTitle}>{planningQuestion}</h3>
        <p className={s.sectionDescription}>Let others know if you are attending.</p>

        <div className={s.topicsPickerSection}>
          <span className={s.topicsPickerLabel}>Topics of interest</span>
          <div className={s.topicsInputContainer}>
            <div className={s.topicsSelectedTags}>
              {selectedTopics.map((topic) => (
                <span key={topic} className={s.topicsTag}>
                  {topic}
                  <button type="button" className={s.topicsTagRemove} onClick={() => handleRemoveTopic(topic)}>
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className={s.topicsSearchInput}
                placeholder={selectedTopics.length === 0 ? 'Add topic' : ''}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
          </div>
        </div>

        <div className={s.topicsSuggestionsList}>
          {/* Show "Add custom topic" option when typing a custom value */}
          {isCustomTopic && (
            <button
              type="button"
              className={s.topicsSuggestionItem}
              onClick={handleAddCustomTopic}
            >
              <span className={s.topicsSuggestionText}>
                Add &quot;{searchValue.trim()}&quot;
              </span>
              <span className={s.topicsSuggestionAdd}>+</span>
            </button>
          )}
          {filteredTopics.map((topic) => {
            const isSelected = selectedTopics.includes(topic);
            return (
              <button
                key={topic}
                type="button"
                className={`${s.topicsSuggestionItem} ${isSelected ? s.topicsSuggestionItemSelected : ''}`}
                onClick={() => handleTopicToggle(topic)}
              >
                <span className={s.topicsSuggestionText}>{topic}</span>
                {isSelected && <span className={s.topicsSuggestionCheck}>✓</span>}
              </button>
            );
          })}
          {filteredTopics.length === 0 && !isCustomTopic && (
            <div className={s.topicsNoResults}>No topics found matching &quot;{searchValue}&quot;</div>
          )}
        </div>
      </div>

      <div className={s.calendarFooter}>
        <button type="button" className={s.calendarCancelButton} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={s.calendarApplyButton} onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  );
}

