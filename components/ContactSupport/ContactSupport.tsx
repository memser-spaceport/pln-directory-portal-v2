'use client';

import * as yup from 'yup';
import isEmpty from 'lodash/isEmpty';
import { useForm } from 'react-hook-form';
import { useCallback, useEffect } from 'react';
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

const getDescriptionByReason = (reason?: string): string | undefined => {
  switch (reason) {
    case 'email_not_found':
      return "We couldn't find any member with this email in the Protocol Labs Network.";
    case 'rejected_access_level':
      return 'Your application to join the Protocol Labs Network was not approved.';
    case 'unexpected_error':
      return "We couldn't complete your request due to a technical issue.";
    default:
      return undefined;
  }
};

const getFieldLabelByTopic = (topic: string): string => {
  switch (topic) {
    case 'Contact support':
      return 'Describe the issue';
    case 'Ask a question':
      return 'Your question';
    case 'Give feedback':
      return 'Your feedback';
    case 'Share an idea':
      return 'Your idea';
    case 'Report a bug':
      return 'Bug description';
    default:
      return 'Describe the issue';
  }
};

const getFieldPlaceholderByTopic = (topic: string): string => {
  switch (topic) {
    case 'Contact support':
      return "I'm having an issue with...";
    case 'Ask a question':
      return 'What would you like to know?';
    case 'Give feedback':
      return 'Share your thoughts...';
    case 'Share an idea':
      return 'Tell us about your idea...';
    case 'Report a bug':
      return 'Describe the bug you encountered...';
    default:
      return "I'm having an issue with...";
  }
};

export function ContactSupport(props: Props) {
  const { userInfo } = props;
  const { open, metadata, topic: contextTopic, closeModal, updateTopic } = useContactSupportContext();
  const contactSupportMutation = useContactSupport();

  const getDefaultValues = useCallback(() => {
    const { email = '', name = '' } = userInfo || {};

    return {
      topic: contextTopic || CONTACT_SUPPORT_TOPICS[0].value,
      email,
      name,
      message: '',
    };
  }, [userInfo, contextTopic]);

  const methods = useForm<ContactSupportFormData>({
    resolver: yupResolver(contactSupportSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
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
    if (open) {
      reset(getDefaultValues());
    }
  }, [open, reset, getDefaultValues]);

  const onSubmit = (data: ContactSupportFormData) => {
    contactSupportMutation.mutate(
      {
        topic: data.topic,
        email: data.email,
        name: data.name,
        message: data.message,
        metadata: {
          ...metadata,
          logged: !isEmpty(userInfo),
          uid: userInfo?.uid || '',
          page: window.location.toString(),
        },
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

  const description = getDescriptionByReason(metadata?.reason as string);
  const fieldLabel = getFieldLabelByTopic(selectedTopic);
  const fieldPlaceholder = getFieldPlaceholderByTopic(selectedTopic);

  return (
    <ModalBase
      title="Contact Support"
      titleIcon={<QuestionCircleIcon />}
      description={description}
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
            updateTopic(option.value);
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
        label={fieldLabel}
        error={errors.message?.message}
        input={{
          as: 'textarea',
          placeholder: fieldPlaceholder,
          rows: 4,
          ...register('message'),
        }}
      />
    </ModalBase>
  );
}
