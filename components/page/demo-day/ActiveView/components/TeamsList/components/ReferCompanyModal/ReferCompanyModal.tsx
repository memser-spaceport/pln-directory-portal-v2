'use client';

import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField } from '@/components/form/FormField/FormField';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import s from './ReferCompanyModal.module.scss';

const EnvelopeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M28 6H4C3.73478 6 3.48043 6.10536 3.29289 6.29289C3.10536 6.48043 3 6.73478 3 7V24C3 24.5304 3.21071 25.0391 3.58579 25.4142C3.96086 25.7893 4.46957 26 5 26H27C27.5304 26 28.0391 25.7893 28.4142 25.4142C28.7893 25.0391 29 24.5304 29 24V7C29 6.73478 28.8946 6.48043 28.7071 6.29289C28.5196 6.10536 28.2652 6 28 6ZM27 24H5V9.27375L15.3237 18.7375C15.5082 18.9069 15.7496 19.0008 16 19.0008C16.2504 19.0008 16.4918 18.9069 16.6763 18.7375L27 9.27375V24Z"
      fill="#1B4DFF"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ReferCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { investorName: string; investorEmail: string; message: string }) => void;
  teamName: string;
  isSubmitting?: boolean;
}

interface ReferralFormData {
  investorName: string;
  investorEmail: string;
  message: string;
}

export const ReferCompanyModal: React.FC<ReferCompanyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teamName,
  isSubmitting = false,
}) => {
  const methods = useForm<ReferralFormData>({
    mode: 'onBlur',
    defaultValues: {
      investorName: '',
      investorEmail: '',
      message: '',
    },
    resolver: async (values) => {
      const errors: Record<string, { message: string }> = {};

      // Validate investorEmail
      if (!values.investorEmail?.trim()) {
        errors.investorEmail = { message: 'Investor email is required' };
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.investorEmail)) {
        errors.investorEmail = { message: 'Please enter a valid email address' };
      }

      // Validate message
      if (!values.message?.trim()) {
        errors.message = { message: 'Message is required' };
      }

      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors,
      };
    },
  });

  const { handleSubmit, reset } = methods;

  const onFormSubmit = (data: ReferralFormData) => {
    onSubmit({
      investorName: data.investorName.trim(),
      investorEmail: data.investorEmail.trim(),
      message: data.message.trim(),
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
              <EnvelopeIcon />
            </div>

            {/* Title */}
            <h2 className={s.title}>Introduce {teamName} to Someone</h2>

            <p className={s.desc}>
              This will send an intro email to the company, yourself, and the person you list below
            </p>

            {/* Form */}
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onFormSubmit)} className={s.form}>
                <FormField
                  name="investorEmail"
                  label="Email Address"
                  placeholder="Enter email (e.g. sarah@mail.com)"
                  disabled={isSubmitting}
                  isRequired
                />

                <FormField
                  name="investorName"
                  label="Name"
                  placeholder="Enter name (e.g. Sarah Cohen)"
                  disabled={isSubmitting}
                />

                <FormTextArea
                  name="message"
                  label="Why are you making this introduction?"
                  placeholder="Enter your message..."
                  description="This will be shared with both the team and the recipient."
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
