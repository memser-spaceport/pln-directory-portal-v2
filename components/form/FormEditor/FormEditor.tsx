import { clsx } from 'clsx';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';
import React, { ReactNode, PropsWithChildren } from 'react';
import dynamic from 'next/dynamic';
import s from './FormEditor.module.scss';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor/RichTextEditor'), { ssr: false });

const SIMPLIFIED_TOOLBAR = [
  [{ header: [false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'bullet' }, { list: 'ordered' }],
  ['link'],
];

interface Props extends PropsWithChildren {
  name: string;
  placeholder: string;
  label?: ReactNode;
  description?: string;
  disabled?: boolean;
  isRequired?: boolean;
  onClick?: () => void;
  autoFocus?: boolean;
  className?: string;
  enableMentions?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  classes?: {
    label?: string;
  };
  onMentionInitiated?: () => void;
  onMentionSearch?: (query: string, resultsCount?: number) => void;
  onMentionSelected?: (member: { uid: string; name: string }, query?: string) => void;
  minHeight?: number;
  simplified?: boolean;
}

export const FormEditor = (props: Props) => {
  const {
    name,
    placeholder,
    label,
    classes,
    description,
    disabled,
    isRequired,
    autoFocus,
    className,
    enableMentions = true,
    maxLength,
    showCharCount = false,
    onMentionInitiated,
    onMentionSearch,
    onMentionSelected,
    minHeight,
    simplified,
  } = props;

  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();
  const value = watch(name);
  const charCount = showCharCount ? (value as string)?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').length ?? 0 : 0;
  const isOverLimit = showCharCount && maxLength != null && charCount > maxLength;

  return (
    <Field.Root className={s.field}>
      {label && (
        <div className={s.labelWrapper}>
          <Field.Label
            className={clsx(s.label, classes?.label, {
              [s.required]: isRequired,
            })}
          >
            {label}
          </Field.Label>
        </div>
      )}

      <RichTextEditor
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        enableMentions={simplified ? false : enableMentions}
        {...(simplified && { toolbarConfig: SIMPLIFIED_TOOLBAR })}
        onChange={(txt) => setValue(name, txt, { shouldValidate: true, shouldDirty: true })}
        className={clsx(className, {
          [s.error]: !!errors[name],
        })}
        onMentionInitiated={onMentionInitiated}
        onMentionSearch={onMentionSearch}
        onMentionSelected={onMentionSelected}
        minHeight={minHeight}
      />
      {errors[name] ? (
        <Field.Error className={s.errorMsg} match={!!errors[name]}>
          {(errors?.[name]?.message as string) ?? ''}
        </Field.Error>
      ) : showCharCount && maxLength != null ? (
        <div className={s.charCounterRow}>
          {description && <span className={s.fieldDescription}>{description}</span>}
          <span className={clsx(s.charCount, { [s.charCountError]: isOverLimit })}>
            {charCount} / {maxLength}
          </span>
        </div>
      ) : description ? (
        <Field.Description className={s.fieldDescription}>{description}</Field.Description>
      ) : null}
    </Field.Root>
  );
};
