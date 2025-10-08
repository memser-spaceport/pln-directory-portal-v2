import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import s from './CompanyFundraiseParagraph.module.scss';

interface CompanyFundraiseParagraphProps {
  paragraph?: string | null;
  editable?: boolean;
}

interface FormData {
  fundraiseParagraph: string;
}

export const CompanyFundraiseParagraph: React.FC<CompanyFundraiseParagraphProps> = ({
  paragraph,
  editable = false,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      fundraiseParagraph: paragraph || '',
    },
  });

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    reset();
    setIsEditMode(false);
  };

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    // TODO: Add API call here
    setIsEditMode(false);
  };

  // Edit mode view
  if (isEditMode) {
    return (
      <div className={s.container}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={s.header}>
            <h3 className={s.subtitle}>Company paragraph for fundraise</h3>
            <div className={s.actions}>
              <button type="button" className={s.cancelButton} onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className={s.saveButton}>
                Save
              </button>
            </div>
          </div>
          <div className={s.editContent}>
            <div className={s.textareaWrapper}>
              <textarea
                {...register('fundraiseParagraph', {
                  maxLength: {
                    value: 400,
                    message: 'Maximum 400 characters allowed',
                  },
                })}
                className={s.textarea}
                placeholder="Say what you do, who it's for, proof/traction, and what you're raising."
                rows={5}
              />
            </div>
            <div className={s.helperText}>
              <p>One short paragraph, max 400 characters.</p>
            </div>
            {errors.fundraiseParagraph && (
              <div className={s.errorText}>{errors.fundraiseParagraph.message}</div>
            )}
          </div>
        </form>
      </div>
    );
  }

  // View mode
  return (
    <div className={s.container}>
      <div className={s.header}>
        <h3 className={s.subtitle}>Company paragraph for fundraise</h3>
        {editable && (
          <button className={s.editButton} onClick={handleEditClick}>
            <EditIcon />
            <span>Edit</span>
          </button>
        )}
      </div>
      <div className={s.content}>
        <p className={s.text}>{paragraph || 'No fundraise paragraph yet.'}</p>
      </div>
    </div>
  );
};

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.25 3H3a1.5 1.5 0 0 0-1.5 1.5v10.5A1.5 1.5 0 0 0 3 16.5h10.5a1.5 1.5 0 0 0 1.5-1.5V9.75M6.75 11.25h2.25L16.5 3.75a1.5 1.5 0 0 0-2.25-2.25L6.75 9v2.25Z"
      stroke="#1B4DFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
