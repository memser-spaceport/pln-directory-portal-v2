'use client';

import * as yup from 'yup';
import isEmpty from 'lodash/isEmpty';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import { useContactSupportStore } from '@/services/contact-support/store';
import { ModalBase } from '@/components/common/ModalBase';
import { QuestionCircleIcon } from '@/components/icons';
import { LabeledInput } from '@/components/common/form/LabeledInput';
import { FormLabel } from '@/components/common/form/FormLabel';
import { FormEditor } from '@/components/form/FormEditor';
import { toast } from '@/components/core/ToastContainer';
import { hostDataUriImages, isBlankHtml } from '@/utils/html';
import { IUserInfo } from '@/types/shared.types';

import { CONTACT_SUPPORT_TOPICS } from './constants';
import { TopicPills } from './TopicPills';

import { useContactSupport } from './hooks/useContactSupport';

import s from './ContactSupport.module.scss';

const MESSAGE_TOOLBAR: (string | Record<string, unknown>)[][] = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'link', 'image'],
];

function hasMessageContent(html: string): boolean {
  return !isBlankHtml(html) || /<img\b/i.test(html);
}

const contactSupportSchema = yup.object({
  topic: yup.string().required('Topic is required'),
  email: yup.string().email('Must be a valid email').required('Email is required'),
  name: yup.string().required('Name is required'),
  message: yup
    .string()
    .required('Description is required')
    .test('has-content', 'Description is required', (value) => hasMessageContent(value ?? '')),
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
  const { open, metadata, topic: contextTopic, prefillMessage, actions } = useContactSupportStore();
  const { closeModal, updateTopic } = actions;
  const contactSupportMutation = useContactSupport();

  const getDefaultValues = useCallback(() => {
    const { email = '', name = '' } = userInfo || {};

    return {
      topic: contextTopic || CONTACT_SUPPORT_TOPICS[0].value,
      email,
      name,
      message: prefillMessage || '',
    };
  }, [userInfo, contextTopic, prefillMessage]);

  const methods = useForm<ContactSupportFormData>({
    resolver: yupResolver(contactSupportSchema) as Resolver<ContactSupportFormData>,
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

  const [isHostingImages, setIsHostingImages] = useState(false);

  const onSubmit = async (data: ContactSupportFormData) => {
    let message = data.message;
    try {
      setIsHostingImages(true);
      message = await hostDataUriImages(message);
    } catch {
      toast.error('Image upload failed. Please try again.');
      return;
    } finally {
      setIsHostingImages(false);
    }

    contactSupportMutation.mutate(
      {
        topic: data.topic,
        email: data.email,
        name: data.name,
        message,
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

          if (metadata?.onCancel && typeof metadata.onCancel === 'function') {
            metadata.onCancel();
          }
        },
      },
    );
  };

  const isLoading = contactSupportMutation.isPending || isHostingImages;

  const isEmailPrefilled = !!userInfo?.email;
  const isNamePrefilled = !!userInfo?.name;

  const description = getDescriptionByReason(metadata?.reason as string);
  const fieldLabel = getFieldLabelByTopic(selectedTopic);
  const fieldPlaceholder = getFieldPlaceholderByTopic(selectedTopic);
  // Every variant used to be titled "Contact Support", so a menu item reading
  // "Give feedback" opened a dialog that said something else across the top —
  // the door and the room disagreeing about where you had arrived. The title
  // now says the topic, and the pills under it are how you change it.
  const title = CONTACT_SUPPORT_TOPICS.find((topic) => topic.value === selectedTopic)?.label ?? 'Contact support';

  return (
    <FormProvider {...methods}>
      <ModalBase
        className={s.root}
        title={title}
        titleIcon={<QuestionCircleIcon />}
        description={description}
        open={open}
        cancel={{
          onClick: () => {
            closeModal();

            if (metadata?.onCancel && typeof metadata.onCancel === 'function') {
              metadata.onCancel();
            }
          },
        }}
        submit={{
          label: isLoading ? 'Sending...' : 'Submit',
          onClick: handleSubmit(onSubmit),
          disabled: !isValid || isLoading,
        }}
      >
        {/* The pills wear the same label chrome as the fields below them, so the
            row reads as one more field rather than as a tab strip over the
            form. `updateTopic` is what keeps `?dialog=` in step — see
            ContactSupportUrlSync. */}
        <FormLabel label="Topic">
          <TopicPills
            value={selectedTopic}
            onChange={(next) => {
              setValue('topic', next, { shouldValidate: true });
              updateTopic(next);
            }}
          />
        </FormLabel>

        <LabeledInput
          label={isEmailPrefilled ? 'Email Address (Prefilled)' : 'Email Address'}
          error={errors.email?.message}
          input={{
            type: 'email',
            placeholder: 'Enter your email',
            readOnly: isEmailPrefilled,
            ...register('email'),
          }}
        />

        <LabeledInput
          label={isNamePrefilled ? 'Name (Prefilled)' : 'Name'}
          error={errors.name?.message}
          input={{
            placeholder: 'Enter your name',
            readOnly: isNamePrefilled,
            ...register('name'),
          }}
        />

        <FormEditor
          name="message"
          label={fieldLabel}
          placeholder={fieldPlaceholder}
          simplified
          toolbarConfig={MESSAGE_TOOLBAR}
          isRequired
          minHeight={120}
          className={s.editor}
        />
      </ModalBase>
    </FormProvider>
  );
}
