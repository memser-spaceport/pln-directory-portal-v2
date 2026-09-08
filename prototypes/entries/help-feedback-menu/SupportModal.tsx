'use client';

import * as yup from 'yup';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';

import { ModalBase } from '@/components/common/ModalBase';
import { QuestionCircleIcon } from '@/components/icons';
import { LabeledInput } from '@/components/common/form/LabeledInput';
import { FormLabel } from '@/components/common/form/FormLabel';
import { FormEditor } from '@/components/form/FormEditor';
import { toast } from '@/components/core/ToastContainer';
import { isBlankHtml } from '@/utils/html';
import { CONTACT_SUPPORT_TOPICS } from '@/components/ContactSupport/constants';

// The production modal's own stylesheet: its width, the editor's overflow
// fixes. Imported so the copy below is the real modal with one control swapped.
import cs from '@/components/ContactSupport/ContactSupport.module.scss';

import { TopicPills } from './TopicPills';

const MESSAGE_TOOLBAR: (string | Record<string, unknown>)[][] = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'link', 'image'],
];

function hasMessageContent(html: string): boolean {
  return !isBlankHtml(html) || /<img\b/i.test(html);
}

const schema = yup.object({
  topic: yup.string().required('Topic is required'),
  email: yup.string().email('Must be a valid email').required('Email is required'),
  name: yup.string().required('Name is required'),
  message: yup
    .string()
    .required('Description is required')
    .test('has-content', 'Description is required', (value) => hasMessageContent(value ?? '')),
});

type FormData = yup.InferType<typeof schema>;

// Verbatim from production ContactSupport.tsx — the field label and
// placeholder follow the topic, which is what makes switching a pill feel like
// switching forms rather than relabelling one.
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
  open: boolean;
  /** The topic the door was opened on. Re-applied each time the modal opens. */
  initialTopic: string;
  viewer: { name: string; email: string };
  onClose: () => void;
}

/**
 * Copy-simplify of production `ContactSupport` (components/ContactSupport):
 * the same ModalBase shell, the same yup schema, the same prefilled Email /
 * Name and the same Quill editor with the same toolbar. Two things change:
 *
 *  - The `Dropdown` labelled "Please choose topic below" becomes `TopicPills`
 *    — all five topics visible at rest (see that file for why).
 *  - The title follows the topic. Production titles every variant "Contact
 *    Support", so a menu item reading "Give feedback" opened a dialog that
 *    said something else across the top — the door and the room disagreeing
 *    about where you were. The title now says the topic, and the pills under
 *    it are how you change it.
 *
 * Simplified: no Zustand store, no URL sync, no image hosting on submit — the
 * mutation is a toast with production's success copy. The `metadata.reason`
 * descriptions (auth errors) are dropped; that door isn't in this prototype.
 */
export function SupportModal({ open, initialTopic, viewer, onClose }: Props) {
  const methods = useForm<FormData>({
    resolver: yupResolver(schema) as Resolver<FormData>,
    defaultValues: { topic: initialTopic, email: viewer.email, name: viewer.name, message: '' },
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

  const topic = watch('topic');

  useEffect(() => {
    if (open) {
      reset({ topic: initialTopic, email: viewer.email, name: viewer.name, message: '' });
    }
  }, [open, initialTopic, viewer.email, viewer.name, reset]);

  const onSubmit = () => {
    toast.success('Thanks! We have received your request and will be in touch soon.', { style: { width: 520 } });
    reset();
    onClose();
  };

  const title = CONTACT_SUPPORT_TOPICS.find((t) => t.value === topic)?.label ?? 'Contact support';

  return (
    <FormProvider {...methods}>
      <ModalBase
        className={cs.root}
        title={title}
        titleIcon={<QuestionCircleIcon />}
        open={open}
        cancel={{ onClick: onClose }}
        submit={{ label: 'Submit', onClick: handleSubmit(onSubmit), disabled: !isValid }}
      >
        {/* The pills wear the same label chrome as the fields under them
            (FormLabel: 14/20/500, 8px gap), so the row reads as one more field
            and not as a tab strip over the form. */}
        <FormLabel label="Topic">
          <TopicPills value={topic} onChange={(next) => setValue('topic', next, { shouldValidate: true })} />
        </FormLabel>

        <LabeledInput
          label="Email Address (Prefilled)"
          error={errors.email?.message}
          input={{ type: 'email', placeholder: 'Enter your email', readOnly: true, ...register('email') }}
        />

        <LabeledInput
          label="Name (Prefilled)"
          error={errors.name?.message}
          input={{ placeholder: 'Enter your name', readOnly: true, ...register('name') }}
        />

        <FormEditor
          name="message"
          label={getFieldLabelByTopic(topic)}
          placeholder={getFieldPlaceholderByTopic(topic)}
          simplified
          toolbarConfig={MESSAGE_TOOLBAR}
          isRequired
          minHeight={120}
          className={cs.editor}
        />
      </ModalBase>
    </FormProvider>
  );
}
