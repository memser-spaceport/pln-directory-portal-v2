import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import s from './CommentInput.module.scss';
import { Checkbox } from '@base-ui-components/react/checkbox';
import * as yup from 'yup';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { usePostComment } from '@/services/forum/hooks/usePostComment';
import { toast } from 'react-toastify';
import { FormEditor } from '@/components/form/FormEditor';
import { FormField } from '@/components/form/FormField';
import { clsx } from 'clsx';
import { useClickAway } from 'react-use';
import { replaceImagesWithMarkdown } from '@/utils/decode';
import { useGetMemberNotificationSettings } from '@/services/notifications/hooks/useGetMemberNotificationSettings';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { useUpdateMemberNotificationSettings } from '@/services/notifications/hooks/useUpdateMemberNotificationSettings';

interface Props {
  tid: number;
  toPid: number;
  replyToName?: string;
  onReset: () => void;
}

const schema = yup.object().shape({
  comment: yup.string().required('Comment is required'),
  emailMe: yup.boolean(),
});

export const CommentInput = ({ tid, toPid, replyToName, onReset }: Props) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [focused, setFocused] = useState(false);
  const { userInfo } = getCookiesFromClient();
  const { data: notificationSettings } = useGetMemberNotificationSettings(userInfo?.uid);
  const { mutateAsync: updateNotificationSettings } = useUpdateMemberNotificationSettings();

  const methods = useForm({
    defaultValues: {
      comment: '',
      emailMe: true,
    },
    resolver: yupResolver(schema),
  });
  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;
  const { emailMe, comment } = watch();

  const { mutateAsync } = usePostComment();

  const handleFocus = useCallback(() => {
    if (isEditorEmpty(comment)) {
      setFocused(false);
    }
  }, [comment]);

  useClickAway(formRef, handleFocus);

  const onSubmit = async (data: any) => {
    try {
      const content = replaceImagesWithMarkdown(data.comment);

      if (notificationSettings && userInfo && notificationSettings?.forumReplyNotificationsEnabled !== data.emailMe) {
        await updateNotificationSettings({
          uid: userInfo.uid,
          forumDigestEnabled: notificationSettings.forumDigestEnabled,
          forumDigestFrequency: notificationSettings.forumDigestFrequency,
          forumReplyNotificationsEnabled: data.emailMe,
        });
      }

      const res = await mutateAsync({
        tid,
        toPid,
        content,
      });

      if (res?.status?.code === 'ok') {
        reset();
        onReset();
        setFocused(false);
      }
    } catch (e) {
      // @ts-ignore
      toast.error(e.message);
    }
  };

  useEffect(() => {
    if (notificationSettings) {
      setValue('emailMe', notificationSettings.forumReplyNotificationsEnabled);
    }
  }, [notificationSettings, setValue]);

  return (
    <FormProvider {...methods}>
      <form className={clsx('input-form', s.root)} noValidate onSubmit={handleSubmit(onSubmit)} ref={formRef}>
        {replyToName && (
          <div className={s.replying}>
            <span className={s.lbl}>
              Replying to <b className={s.accent}>{replyToName}</b>
            </span>
            <button type="button" onClick={onReset}>
              Cancel
            </button>
          </div>
        )}
        <div className={s.content}>
          {focused ? <FormEditor name="comment" placeholder="Comment" autoFocus /> : <FormField name="dummy" placeholder="Comment" onClick={() => setFocused(true)} />}
          <button className={s.submitBtn} type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Image src="/icons/spinner.svg" width={22} height={22} alt="Spinner" /> : <ArrowUpIcon />}
          </button>
        </div>
        {focused && (
          <div className={s.content}>
            <label className={s.Label}>
              <div className={s.primary}>Email me when someone replies.</div>
              <Checkbox.Root className={s.Checkbox} checked={emailMe} onCheckedChange={(v: boolean) => setValue('emailMe', v, { shouldValidate: true, shouldDirty: true })}>
                <Checkbox.Indicator className={s.Indicator}>
                  <CheckIcon className={s.Icon} />
                </Checkbox.Indicator>
              </Checkbox.Root>
            </label>
            <div className={s.submitBtn} style={{ visibility: 'hidden', height: 0 }}>
              <ArrowUpIcon />
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  );
};

const ArrowUpIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.9173 10.3546C17.8215 10.4507 17.7077 10.527 17.5823 10.5791C17.457 10.6311 17.3226 10.6579 17.1868 10.6579C17.0511 10.6579 16.9167 10.6311 16.7914 10.5791C16.666 10.527 16.5522 10.4507 16.4564 10.3546L12.0315 5.92966V18.5625C12.0315 18.836 11.9228 19.0983 11.7294 19.2917C11.536 19.4851 11.2737 19.5937 11.0002 19.5937C10.7267 19.5937 10.4644 19.4851 10.271 19.2917C10.0776 19.0983 9.96896 18.836 9.96896 18.5625V5.92966L5.54232 10.3546C5.34858 10.5483 5.08583 10.6572 4.81185 10.6572C4.53787 10.6572 4.27511 10.5483 4.08138 10.3546C3.88765 10.1609 3.77881 9.89809 3.77881 9.62411C3.77881 9.35014 3.88765 9.08738 4.08138 8.89365L10.2689 2.70615C10.3647 2.61001 10.4785 2.53372 10.6039 2.48167C10.7292 2.42962 10.8636 2.40283 10.9993 2.40283C11.1351 2.40283 11.2695 2.42962 11.3948 2.48167C11.5202 2.53372 11.634 2.61001 11.7298 2.70615L17.9173 8.89365C18.0135 8.98945 18.0897 9.10329 18.1418 9.22865C18.1938 9.354 18.2206 9.48839 18.2206 9.62411C18.2206 9.75984 18.1938 9.89423 18.1418 10.0196C18.0897 10.1449 18.0135 10.2588 17.9173 10.3546Z"
      fill="white"
    />
  </svg>
);

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function isEditorEmpty(html: string): boolean {
  const trimmed = html.trim();
  return trimmed === '<p><br></p>' || trimmed === '';
}
