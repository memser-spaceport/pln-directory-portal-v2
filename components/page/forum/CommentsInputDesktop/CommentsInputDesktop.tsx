import React from 'react';

import s from './CommentsInputDesktop.module.scss';
import { FormProvider, useForm } from 'react-hook-form';
import { FormEditor } from '@/components/form/FormEditor';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { usePostComment } from '@/services/forum/hooks/usePostComment';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';

interface Props {
  tid: number;
  toPid: number;
}

const schema = yup.object().shape({
  comment: yup.string().required('Comment is required'),
  emailMe: yup.boolean(),
});

export const CommentsInputDesktop = ({ tid, toPid }: Props) => {
  const methods = useForm({
    defaultValues: {
      comment: '',
      emailMe: true,
    },
    resolver: yupResolver(schema),
  });
  const { handleSubmit, reset, watch, setValue } = methods;
  const { emailMe } = watch();

  const { mutateAsync } = usePostComment();

  const onSubmit = async (data: any) => {
    try {
      const res = await mutateAsync({
        tid,
        toPid,
        content: data.comment,
      });

      if (res?.status?.code === 'ok') {
        reset();
      }
    } catch (e) {
      // @ts-ignore
      toast.error(e.message);
    }
  };

  return (
    <FormProvider {...methods}>
      <form className={s.root} noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormEditor name="comment" placeholder="Comment" label="Write your message" />
        <label className={s.Label}>
          <div className={s.primary}>Email me when someone replies.</div>
          <Checkbox.Root className={s.Checkbox} checked={emailMe} onCheckedChange={(v: boolean) => setValue('emailMe', v, { shouldValidate: true, shouldDirty: true })}>
            <Checkbox.Indicator className={s.Indicator}>
              <CheckIcon className={s.Icon} />
            </Checkbox.Indicator>
          </Checkbox.Root>
        </label>

        <div className={s.controls}>
          <button type="button" className={s.secondaryBtn} onClick={() => reset()}>
            Cancel
          </button>
          <button type="submit" className={s.primaryBtn}>
            Comment
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default CommentsInputDesktop;

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
