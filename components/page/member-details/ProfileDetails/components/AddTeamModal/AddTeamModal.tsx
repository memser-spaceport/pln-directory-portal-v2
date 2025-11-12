'use client';

import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/form/FormField';

import s from './AddTeamModal.module.scss';

interface AddTeamFormData {
  teamName: string;
  role: string;
}

const addTeamSchema = yup.object({
  teamName: yup.string().required('Team name is required'),
  role: yup.string().required('Role is required'),
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: AddTeamFormData) => void;
}

export const AddTeamModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const methods = useForm<AddTeamFormData>({
    defaultValues: {
      teamName: '',
      role: '',
    },
    resolver: yupResolver(addTeamSchema),
  });

  const { handleSubmit, reset } = methods;

  const handleFormSubmit = async (data: AddTeamFormData) => {
    // TODO: Call add team mutation here
    console.log('Form submitted:', data);

    if (onSubmit) {
      onSubmit(data);
    }

    // Reset form and close modal
    reset();
    onClose();
  };

  const handleClose = () => {
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
          <p className={s.subtitle}>Tell us about your team and your role.</p>
        </div>

        {/* Form */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className={s.form}>
            <div className={s.formContent}>
              <FormField name="teamName" label="Team Name" placeholder="Enter team name" isRequired />

              <FormField name="role" label="Your Role" placeholder="Enter your role" isRequired />
            </div>

            {/* Footer */}
            <div className={s.footer}>
              <Button type="button" style="border" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" style="fill">
                Add Team
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
