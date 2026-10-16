'use client';

import * as yup from 'yup';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import { ModalBase } from '@/components/common/ModalBase';
import { QuestionCircleIcon } from '@/components/icons';
import { LabeledInput } from '@/components/common/form/LabeledInput';
import { FormLabel } from '@/components/common/form/FormLabel';
import { FormEditor } from '@/components/form/FormEditor';
import { toast } from '@/components/core/ToastContainer';
import { isBlankHtml } from '@/utils/html';
import { CONTACT_SUPPORT_TOPICS } from '@/components/ContactSupport/constants';
import { TopicPills } from '@/components/ContactSupport/TopicPills';

// Production stylesheet, verbatim.
import s from '@/components/ContactSupport/ContactSupport.module.scss';

/**
 * COPY-SIMPLIFY of production `ContactSupport` (develop, 2026-10-12): the form
 * the header's (?) opens — topic pills, prefilled email and name, the rich
 * description whose label and placeholder follow the topic, Cancel / Submit.
 * Transcribed as is; only the data layer is swapped:
 *
 * - open state, topic and viewer come in as props instead of
 *   `useContactSupportStore` / the root layout's `userInfo`;
 * - the send is a short mocked wait and a toast (production posts through
 *   `useContactSupport` after hosting pasted images); nothing leaves the page;
 * - analytics and the `?dialog=` URL sync are left out.
 */

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

interface Props {
  /** The topic it opened on; null is closed. */
  topic: string | null;
  onClose: () => void;
  viewer?: { name?: string; email?: string };
}

export function ContactSupportModal({ topic: openTopic, onClose, viewer }: Props) {
  const open = openTopic !== null;

  const getDefaultValues = useCallback(
    () => ({
      topic: openTopic || CONTACT_SUPPORT_TOPICS[0].value,
      email: viewer?.email ?? '',
      name: viewer?.name ?? '',
      message: '',
    }),
    [openTopic, viewer],
  );

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

  const [isLoading, setIsLoading] = useState(false);

  /* Mock: a short wait in place of the request, then production's close. */
  const onSubmit = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsLoading(false);
    reset();
    onClose();
    toast.success('Thanks! Your message has been sent.');
  };

  const isEmailPrefilled = !!viewer?.email;
  const isNamePrefilled = !!viewer?.name;

  const fieldLabel = getFieldLabelByTopic(selectedTopic);
  const fieldPlaceholder = getFieldPlaceholderByTopic(selectedTopic);
  const title = CONTACT_SUPPORT_TOPICS.find((topic) => topic.value === selectedTopic)?.label ?? 'Contact support';

  return (
    <FormProvider {...methods}>
      <ModalBase
        className={s.root}
        title={title}
        titleIcon={<QuestionCircleIcon />}
        open={open}
        cancel={{ onClick: onClose }}
        submit={{
          label: isLoading ? 'Sending...' : 'Submit',
          onClick: handleSubmit(onSubmit),
          disabled: !isValid || isLoading,
        }}
      >
        <FormLabel label="Topic">
          <TopicPills value={selectedTopic} onChange={(next) => setValue('topic', next, { shouldValidate: true })} />
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
