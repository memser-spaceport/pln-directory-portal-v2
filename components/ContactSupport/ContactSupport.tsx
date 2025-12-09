'use client';

import * as yup from 'yup';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useContactSupportContext } from '@/components/ContactSupport/context/ContactSupportContext';
import { ModalBase } from '@/components/common/ModalBase';
import { QuestionCircleIcon } from '@/components/icons';
import { LabeledInput } from '@/components/common/form/LabeledInput';
import { Dropdown } from '@/components/form/Dropdown';
import { IUserInfo } from '@/types/shared.types';

import { CONTACT_SUPPORT_TOPICS } from './constants';

import { useContactSupport } from './hooks/useContactSupport';

import s from './ContactSupport.module.scss';

const contactSupportSchema = yup.object().shape({
  topic: yup.string().required('Topic is required'),
  email: yup.string().email('Must be a valid email').required('Email is required'),
  name: yup.string().required('Name is required'),
  message: yup.string().required('Description is required'),
});

type ContactSupportFormData = yup.InferType<typeof contactSupportSchema>;

interface Props {
  userInfo?: IUserInfo;
}

export function ContactSupport(props: Props) {
  const { userInfo } = props;
  const { open, metadata, closeModal } = useContactSupportContext();
  const contactSupportMutation = useContactSupport();

  const methods = useForm<ContactSupportFormData>({
    resolver: yupResolver(contactSupportSchema),
    defaultValues: {
      topic: CONTACT_SUPPORT_TOPICS[0].value,
      email: userInfo?.email || '',
      name: '',
      message: '',
    },
    mode: 'onBlur',
  });

  const {
    watch,
    reset,
    setValue,
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = methods;

  const selectedTopic = watch('topic');

  useEffect(() => {
    if (userInfo?.email) {
      setValue('email', userInfo.email);
    }
  }, [userInfo?.email, setValue]);

  useEffect(() => {
    if (open) {
      reset({
        topic: CONTACT_SUPPORT_TOPICS[0].value,
        email: userInfo?.email || '',
        name: '',
        message: '',
      });
    }
  }, [open, reset, userInfo?.email]);

  const onSubmit = (data: ContactSupportFormData) => {
    contactSupportMutation.mutate(
      {
        topic: data.topic,
        email: data.email,
        name: data.name,
        message: data.message,
        metadata: metadata || {},
      },
      {
        onSuccess: () => {
          reset();
          closeModal();
        },
      },
    );
  };

  const isLoading = contactSupportMutation.isPending;

  return (
    <ModalBase
      title="Contact Support"
      titleIcon={<QuestionCircleIcon />}
      description="No member with this email exists in the Protocol Labs Network. Double-check your email or try a different one. If you believe this is an error, our support team can help."
      open={open}
      cancel={{
        onClick: closeModal,
      }}
      submit={{
        label: isLoading ? 'Sending...' : 'Submit',
        onClick: handleSubmit(onSubmit),
        disabled: !isValid || isLoading,
      }}
    >
      <Dropdown
        id="topic"
        label="Please choose topic below"
        options={CONTACT_SUPPORT_TOPICS}
        onItemSelect={(option) => {
          if (option) {
            setValue('topic', option.value, { shouldValidate: true });
          }
        }}
        uniqueKey="value"
        displayKey="label"
        selectedOption={CONTACT_SUPPORT_TOPICS.find((topic) => topic.value === selectedTopic)}
        isMandatory
        classes={{
          label: s.ddLabel,
          ddRoot: s.ddRoot,
          option: s.option,
          selectedOption: s.selectedOption,
        }}
        arrowImgUrl="/icons/arrow-down.svg"
      />

      <LabeledInput
        label="Email Address"
        error={errors.email?.message}
        input={{
          type: 'email',
          placeholder: 'Enter your email',
          ...register('email'),
        }}
      />

      <LabeledInput
        label="Name"
        error={errors.name?.message}
        input={{
          placeholder: 'Enter your name',
          ...register('name'),
        }}
      />

      <LabeledInput
        label="Describe the issue"
        error={errors.message?.message}
        input={{
          as: 'textarea',
          placeholder: "I'm having an issue with...",
          rows: 4,
          ...register('message'),
        }}
      />
    </ModalBase>
  );
}
