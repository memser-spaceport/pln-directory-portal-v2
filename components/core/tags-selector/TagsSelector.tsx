import React, { useEffect, useRef, useState } from 'react';
import HiddenField from '@/components/form/hidden-field';
import { useFormContext } from 'react-hook-form';
import { DEFAULT_ASK_TAGS } from '@/utils/constants';
import { FormFieldError } from '@/components/form/form-field-error';

import s from './TagsSelector.module.css';
import useClickedOutside from '@/hooks/useClickedOutside';
import { clsx } from 'clsx';

export const TagsSelector = () => {
  const tagSearchRef = useRef<HTMLInputElement | null>(null);
  const tagsOptionsRef = useRef<HTMLDivElement | null>(null);
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const { tags, disabled } = watch();
  const [isTagsDropdown, setIsTagsDropdown] = useState(false);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);

  useClickedOutside({ callback: () => setIsTagsDropdown(false), ref: tagSearchRef });

  useEffect(() => {
    if (tagsOptionsRef.current) {
      tagsOptionsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isTagsDropdown]);

  const onTagSectionClickHandler = () => {
    if (disabled) {
      return;
    }

    setIsTagsDropdown(true);
    setFilteredTags(() => {
      return DEFAULT_ASK_TAGS.filter((initialTag: string) => !tags.includes(initialTag));
    });
  };

  const onTagRemoveClickhandler = (tag: string) => {
    setValue(
      'tags',
      tags.filter((previousTag: string) => previousTag !== tag),
      { shouldValidate: true },
    );
  };

  const onTagClicHandler = (tag: string) => {
    const allTags = [...tags, tag];
    setIsTagsDropdown(true);

    if (tagSearchRef.current) {
      tagSearchRef.current.value = '';
    }

    setFilteredTags(() => DEFAULT_ASK_TAGS.filter((defaultTag: string) => !allTags.includes(defaultTag)));
    setValue('tags', [...tags, tag], { shouldValidate: true });
  };

  const onTagsChangeHandler = (e: any) => {
    const inputValue = e.target.value.trim().toLowerCase();

    setFilteredTags(() => {
      const availableTags = DEFAULT_ASK_TAGS.filter((tag: string) => tag.toLowerCase().includes(inputValue));
      return availableTags.filter((tag) => !tags.includes(tag));
    });
  };

  const onTagsKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
    if (e.key === 'Backspace' && e.target.value === '') {
      setValue('tags', tags.slice(0, -1), { shouldValidate: true });

      setFilteredTags((prev: any) => {
        const finalTags = [...prev, tags[tags.length - 1]];
        return DEFAULT_ASK_TAGS.filter((defaultTag: string) => finalTags.includes(defaultTag));
      });
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        className={clsx(s.root, {
          [s.error]: !!errors['tags'],
        })}
        onClick={onTagSectionClickHandler}
      >
        {tags.length > 0 && (
          <div className={s.tags}>
            {tags?.map((tag: string, index: number) => (
              <div className={s.tag} key={`${tag}+${index}`}>
                {tag}
                <button disabled={disabled} onClick={() => onTagRemoveClickhandler(tag)} className={s.tagButton}>
                  <img alt="delete" src="/icons/close-gray.svg" />
                </button>
                <HiddenField value={tag ?? ''} defaultValue={tag ?? ''} name={`askTag${index}-name`} />
              </div>
            ))}
          </div>
        )}
        <input
          disabled={disabled}
          onKeyDown={onTagsKeyDown}
          ref={tagSearchRef}
          onChange={onTagsChangeHandler}
          className={s.tagInput}
          placeholder={`${tags?.length === 0 ? 'Select tags' : ''}`}
          type="text"
        />
      </div>
      <FormFieldError name="tags" />
      {isTagsDropdown && (
        <div className={s.options} ref={tagsOptionsRef}>
          {filteredTags?.length === 0 && <div className={s.optionsEmpty}>No tags found</div>}
          {filteredTags.map((tag: string, index: number) => (
            <button onClick={() => onTagClicHandler(tag)} className={s.option} key={`${tag}+${index}`}>
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
