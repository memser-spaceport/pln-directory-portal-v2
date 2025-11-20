'use client';

import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/form/FormField';
import { useCreateTeamRequest } from '@/services/teams/hooks/useCreateTeamRequest';

import s from './AddTeamModal.module.scss';

interface AddTeamFormData {
  teamName: string;
  websiteAddress: string;
}

// URL validation regex that accepts URLs with or without protocol
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

const addTeamSchema = yup.object({
  teamName: yup.string().required('Team name is required'),
  websiteAddress: yup
    .string()
    .optional()
    .defined()
    .test('is-valid-url', 'Please enter a valid URL', function (value) {
      // Only validate if the field is populated
      if (!value || value.trim().length === 0) {
        return true; // Valid if empty
      }
      return urlRegex.test(value); // Validate URL format if populated
    }),
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  requesterEmailId: string;
  onSuccess?: (teamName: string) => void;
}

export const AddTeamModal = ({ isOpen, onClose, requesterEmailId, onSuccess }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync } = useCreateTeamRequest();

  const methods = useForm<AddTeamFormData>({
    defaultValues: {
      teamName: '',
      websiteAddress: '',
    },
    resolver: yupResolver(addTeamSchema),
  });

  const { handleSubmit, reset } = methods;

  const handleFormSubmit = async (data: AddTeamFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await mutateAsync({
        requesterEmailId,
        teamName: data.teamName,
        websiteAddress: data.websiteAddress,
      });

      // Call onSuccess callback with team name before closing
      if (onSuccess) {
        onSuccess(data.teamName);
      }

      // Reset form and close modal
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to submit team request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className={s.modal}>
        {/* Close button */}
        <button className={s.closeButton} onClick={handleClose} aria-label="Close modal">
          <CloseIcon />
        </button>

        {/* Header */}
        <div className={s.header}>
          <h2 className={s.title}>Add Your Team</h2>
          <p className={s.subtitle}>Enter your team&apos;s details below.</p>
        </div>

        {/* Form */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className={s.form}>
            <div className={s.formContent}>
              <FormField name="teamName" label="Team Name" placeholder="Enter team name" isRequired />

              <FormField
                name="websiteAddress"
                label="Website Address"
                description="Paste a URL (LinkedIn, company website, etc.)"
                placeholder="Enter website address"
              />
            </div>

            {/* Footer */}
            <div className={s.footer}>
              <Button type="button" style="border" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" style="fill" disabled={isSubmitting || !methods.formState.isValid}>
                {isSubmitting ? 'Submitting...' : 'Add Team'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
};

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
