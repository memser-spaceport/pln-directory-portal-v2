'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useSubmitDemoDayFeedback } from '@/services/demo-day/hooks/useSubmitDemoDayFeedback';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';

import s from './FeedbackDialog.module.scss';

const ChatIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M29 8V24C29 24.5304 28.7893 25.0391 28.4142 25.4142C28.0392 25.7893 27.5305 26 27 26H10.3125L6.30253 29.5138C6.29771 29.519 6.29225 29.5236 6.28629 29.5275C5.92716 29.8326 5.47126 30.0001 5.00004 30C4.70663 29.9995 4.4169 29.9346 4.15128 29.81C3.80579 29.6508 3.51348 29.3954 3.30931 29.0744C3.10515 28.7534 2.99777 28.3804 3.00003 28V8C3.00003 7.46957 3.21075 6.96086 3.58582 6.58579C3.96089 6.21071 4.4696 6 5.00004 6H27C27.5305 6 28.0392 6.21071 28.4142 6.58579C28.7893 6.96086 29 7.46957 29 8Z"
      fill="#1B4DFF"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface FeedbackFormData {
  rating: number | null;
  qualityFeedback: string;
  improvementSuggestions: string;
}

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FeedbackFormData>({
    defaultValues: {
      rating: null,
      qualityFeedback: '',
      improvementSuggestions: '',
    },
  });

  const { mutate: submitFeedback, isPending } = useSubmitDemoDayFeedback();
  const { onCompletedViewFeedbackSubmitted } = useDemoDayAnalytics();

  const selectedRating = watch('rating');

  const handleRatingClick = (rating: number) => {
    setValue('rating', rating, { shouldValidate: true });
  };

  const handleFormSubmit = (data: FeedbackFormData) => {
    if (!data.rating) {
      return;
    }

    const payload = {
      rating: data.rating,
      qualityComments: data.qualityFeedback,
      improvementComments: data.improvementSuggestions,
    };

    submitFeedback(payload, {
      onSuccess: () => {
        // Track analytics event with rating
        onCompletedViewFeedbackSubmitted({ rating: data.rating });

        reset();
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: (error) => {
        console.error('Failed to submit feedback:', error);
        // You can add toast notification here if needed
      },
    });
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className={s.dialog}>
        <button className={s.closeButton} onClick={handleCancel} type="button">
          <CloseIcon />
        </button>

        <div className={s.content}>
          {/* Icon */}
          <div className={s.iconContainer}>
            <ChatIcon />
          </div>

          {/* Title and Description */}
          <div className={s.textContainer}>
            <div className={s.titleBody}>
              <h2 className={s.title}>How was your Demo Day experience?</h2>
              <p className={s.description}>
                Help us make future Demo Days even better.
                <br />
                This feedback will be shared only with the organizing team.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className={s.form}>
            {/* Rating Field */}
            <div className={s.field}>
              <label className={s.label}>
                <span className={s.labelText}>How likely are you to recommend PL Demo Day to other investors?</span>
                <span className={s.required}>*</span>
              </label>

              <div className={s.ratingScale}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    className={`${s.ratingButton} ${selectedRating === rating ? s.selected : ''}`}
                    onClick={() => handleRatingClick(rating)}
                  >
                    {rating}
                  </button>
                ))}
              </div>

              <div className={s.ratingLabels}>
                <span className={s.ratingLabel}>Not at all likely</span>
                <span className={s.ratingLabel}>Extremely likely</span>
              </div>

              {errors.rating && <span className={s.error}>{errors.rating.message}</span>}

              <input
                type="hidden"
                {...register('rating', {
                  required: 'Please select a rating',
                  validate: (value) => value !== null || 'Please select a rating',
                })}
              />
            </div>

            {/* Quality Feedback Field */}
            <div className={s.field}>
              <label className={s.label}>
                <span className={s.labelText}>How would you describe the quality of startups at this Demo Day?</span>
                <span className={s.optional}>(Optional)</span>
              </label>

              <textarea
                {...register('qualityFeedback')}
                className={s.textarea}
                placeholder="Share your thoughts"
                rows={5}
              />
            </div>

            {/* Improvement Suggestions Field */}
            <div className={s.field}>
              <label className={s.label}>
                <span className={s.labelText}>What would improve your Demo Day experience?</span>
                <span className={s.optional}>(Optional)</span>
              </label>

              <textarea
                {...register('improvementSuggestions')}
                className={s.textarea}
                placeholder="Share your thoughts"
                rows={5}
              />
            </div>

            {/* Footer Actions */}
            <div className={s.footer}>
              <div className={s.actions}>
                <Button
                  type="button"
                  style="border"
                  variant="primary"
                  size="m"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" style="fill" variant="primary" size="m" disabled={isPending}>
                  {isPending ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};
