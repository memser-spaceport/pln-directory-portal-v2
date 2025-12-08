'use client';

import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import s from './GiveFeedbackModal.module.scss';

const ChatIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.0028 3C13.7584 2.99951 11.5521 3.58011 9.59865 4.68529C7.6452 5.79046 6.01115 7.38256 4.85555 9.30662C3.69996 11.2307 3.06219 13.4212 3.00432 15.6648C2.94646 17.9085 3.47046 20.1289 4.52534 22.11L3.10659 26.3662C2.98907 26.7186 2.97201 27.0968 3.05733 27.4583C3.14266 27.8199 3.32698 28.1505 3.58965 28.4132C3.85232 28.6759 4.18296 28.8602 4.5445 28.9455C4.90604 29.0308 5.2842 29.0138 5.63659 28.8962L9.89284 27.4775C11.6363 28.4048 13.5681 28.9228 15.5416 28.992C17.5151 29.0613 19.4785 28.68 21.2827 27.8772C23.0868 27.0743 24.6844 25.871 25.9541 24.3586C27.2238 22.8462 28.1322 21.0644 28.6105 19.1484C29.0887 17.2325 29.1242 15.2328 28.7143 13.301C28.3043 11.3693 27.4596 9.55642 26.2444 7.9999C25.0291 6.44337 23.4753 5.18415 21.7007 4.31782C19.9262 3.45149 17.9776 3.00081 16.0028 3ZM10.5028 17.5C10.2062 17.5 9.91616 17.412 9.66948 17.2472C9.42281 17.0824 9.23055 16.8481 9.11702 16.574C9.00349 16.2999 8.97378 15.9983 9.03166 15.7074C9.08954 15.4164 9.2324 15.1491 9.44218 14.9393C9.65196 14.7296 9.91923 14.5867 10.2102 14.5288C10.5012 14.4709 10.8028 14.5006 11.0769 14.6142C11.351 14.7277 11.5852 14.92 11.75 15.1666C11.9149 15.4133 12.0028 15.7033 12.0028 16C12.0028 16.3978 11.8448 16.7794 11.5635 17.0607C11.2822 17.342 10.9007 17.5 10.5028 17.5ZM16.0028 17.5C15.7062 17.5 15.4162 17.412 15.1695 17.2472C14.9228 17.0824 14.7305 16.8481 14.617 16.574C14.5035 16.2999 14.4738 15.9983 14.5317 15.7074C14.5895 15.4164 14.7324 15.1491 14.9422 14.9393C15.152 14.7296 15.4192 14.5867 15.7102 14.5288C16.0012 14.4709 16.3028 14.5006 16.5769 14.6142C16.851 14.7277 17.0852 14.92 17.25 15.1666C17.4149 15.4133 17.5028 15.7033 17.5028 16C17.5028 16.3978 17.3448 16.7794 17.0635 17.0607C16.7822 17.342 16.4007 17.5 16.0028 17.5ZM21.5028 17.5C21.2062 17.5 20.9162 17.412 20.6695 17.2472C20.4228 17.0824 20.2306 16.8481 20.117 16.574C20.0035 16.2999 19.9738 15.9983 20.0317 15.7074C20.0895 15.4164 20.2324 15.1491 20.4422 14.9393C20.652 14.7296 20.9192 14.5867 21.2102 14.5288C21.5012 14.4709 21.8028 14.5006 22.0769 14.6142C22.351 14.7277 22.5852 14.92 22.75 15.1666C22.9149 15.4133 23.0028 15.7033 23.0028 16C23.0028 16.3978 22.8448 16.7794 22.5635 17.0607C22.2822 17.342 21.9007 17.5 21.5028 17.5Z"
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

interface GiveFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { feedback: string }) => void;
  teamName: string;
  isSubmitting?: boolean;
}

interface FeedbackFormData {
  feedback: string;
}

export const GiveFeedbackModal: React.FC<GiveFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teamName,
  isSubmitting = false,
}) => {
  const methods = useForm<FeedbackFormData>({
    mode: 'onBlur',
    defaultValues: {
      feedback: '',
    },
    resolver: async (values) => {
      const errors: Record<string, { message: string }> = {};

      // Validate feedback
      if (!values.feedback?.trim()) {
        errors.feedback = { message: 'Feedback is required' };
      }

      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors,
      };
    },
  });

  const { handleSubmit, reset } = methods;

  const onFormSubmit = (data: FeedbackFormData) => {
    onSubmit({
      feedback: data.feedback.trim(),
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={s.overlay}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={s.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button className={s.closeButton} onClick={handleClose} aria-label="Close modal">
              <CloseIcon />
            </button>

            {/* Icon */}
            <div className={s.iconWrapper}>
              <ChatIcon />
            </div>

            {/* Content */}
            <div className={s.content}>
              {/* Title */}
              <div className={s.textWrapper}>
                <h2 className={s.title}>Send Feedback to {teamName}</h2>
                <p className={s.description}>Your feedback will directly be shared with the founder(s) via email.</p>
              </div>

              {/* Form */}
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onFormSubmit)} className={s.form}>
                  <FormTextArea
                    name="feedback"
                    label="Your Feedback"
                    placeholder="Share your thoughts, concerns, or recommendations…"
                    disabled={isSubmitting}
                    isRequired
                    rows={5}
                  />

                  {/* Actions */}
                  <div className={s.actions}>
                    <button type="button" className={s.cancelButton} onClick={handleClose} disabled={isSubmitting}>
                      Cancel
                    </button>
                    <button type="submit" className={s.submitButton} disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </FormProvider>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
