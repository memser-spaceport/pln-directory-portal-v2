import React from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { OfficeHoursFormField } from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursFormField';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { TEditOfficeHoursForm } from '@/components/page/member-details/OfficeHoursDetails/types';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
import { EditOfficeHoursMobileControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursMobileControls';
import { useMember } from '@/services/members/hooks/useMember';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { ADMIN_ROLE } from '@/utils/constants';
import * as yup from 'yup';

import { useUpdateMemberParams } from '@/services/members/hooks/useUpdateMemberParams';
import { useValidateOfficeHours } from '@/services/members/hooks/useValidateOfficeHours';
import { FormTagsInput } from '@/components/form/FormTagsInput';

import s from './EditOfficeHoursForm.module.scss';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    return new Promise((resolve, reject) => {
      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

export const EditOfficeHoursForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();
  const { mutateAsync: validateOfficeHours } = useValidateOfficeHours();
  const [validationCache, setValidationCache] = React.useState<Map<string, { isValid: boolean; error?: string }>>(new Map());
  const [isValidatingOfficeHours, setIsValidatingOfficeHours] = React.useState(false);
  const { onSubmitUpdatedOfficeHours } = useMemberAnalytics();

  const debouncedValidateOfficeHours = React.useMemo(
    () =>
      debounce(async (link: string) => {
        try {
          setIsValidatingOfficeHours(true);
          const result = await validateOfficeHours({ link });
          const isValid = result?.status === 'OK';
          const error = isValid ? undefined : result?.error || 'This office hours link appears to be invalid or inaccessible';

          setValidationCache((prev) => new Map(prev).set(link, { isValid, error }));
          return { isValid, error };
        } catch (error) {
          const errorMessage = 'Unable to validate the office hours link. Please check the URL and try again.';
          setValidationCache((prev) => new Map(prev).set(link, { isValid: false, error: errorMessage }));
          return { isValid: false, error: errorMessage };
        } finally {
          setIsValidatingOfficeHours(false);
        }
      }, 1000),
    [validateOfficeHours],
  );

  const schema = yup.object().shape({
    officeHours: yup
      .string()
      .defined()
      .test('office-hours-validation', 'Invalid office hours link', async function (value) {
        // Skip validation if empty
        if (!value || !value.trim()) {
          return true;
        }

        // Basic URL validation first
        try {
          new URL(value);
        } catch {
          return this.createError({ message: 'Please enter a valid URL' });
        }

        // Only validate if the field has changed from default
        const defaultValue = member.officeHours ?? '';
        if (value === defaultValue) {
          return true; // Don't validate unchanged default values
        }

        // Check cache first
        const cached = validationCache.get(value);
        if (cached) {
          if (cached.isValid) {
            return true;
          } else {
            return this.createError({ message: cached.error });
          }
        }

        // If not in cache, trigger debounced validation
        // For immediate validation, we'll return true and let the debounced function update the cache
        // The form will re-validate when the cache updates
        await debouncedValidateOfficeHours(value);

        // Return true for now to avoid blocking, validation will happen async
        return true;
      }),
    officeHoursInterestedIn: yup.array().of(yup.string().defined()).defined().nullable(),
    officeHoursCanHelpWith: yup.array().of(yup.string().defined()).defined().nullable(),
  });

  const methods = useForm<TEditOfficeHoursForm>({
    defaultValues: {
      officeHours: member.officeHours ?? '',
      officeHoursInterestedIn: member.ohInterest ?? [], // member.officeHoursInterestedIn,
      officeHoursCanHelpWith: member.ohHelpWith ?? [], // member.officeHoursCanHelpWith,
    },
    resolver: yupResolver(schema),
    mode: 'all',
  });

  const isAdmin = !!(userInfo && userInfo.roles?.includes(ADMIN_ROLE));
  const { handleSubmit, reset, trigger, watch } = methods;
  const { mutateAsync } = useUpdateMemberParams();
  const { data: memberData } = useMember(member.id);
  const { onSaveContactDetailsClicked } = useMemberAnalytics();

  const officeHoursValue = watch('officeHours');

  // Re-validate when cache updates for the current field value
  React.useEffect(() => {
    if (officeHoursValue && validationCache.has(officeHoursValue)) {
      trigger('officeHours');
    }
  }, [validationCache, officeHoursValue, trigger]);

  const onSubmit = async (formData: TEditOfficeHoursForm) => {
    onSaveContactDetailsClicked();

    if (!memberData) {
      return;
    }

    const payload = {
      officeHours: formData.officeHours,
      ohInterest: formData.officeHoursInterestedIn,
      ohHelpWith: formData.officeHoursCanHelpWith,
    };

    onSubmitUpdatedOfficeHours(payload);

    const res = await mutateAsync({
      uid: memberData.memberInfo.uid,
      payload,
    });

    if (!res.isError) {
      router.refresh();
      reset();
      onClose();
    } else if (res?.errorData?.message) {
      toast.error(res.errorData.message);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
        noValidate
      >
        <EditOfficeHoursFormControls onClose={onClose} title="Edit Office Hours" />
        <div className={s.body}>
          <div className={s.row}>
            <OfficeHoursFormField
              name="officeHours"
              label="Office Hours"
              placeholder="Enter Office Hours link"
              description="Drop your calendar link here so others can get in touch with you at a time that is convenient. We recommend 15-min meetings scheduled."
              validationCache={validationCache}
              isValidatingField={isValidatingOfficeHours}
            />
          </div>
          <div className={s.row}>
            <FormTagsInput selectLabel="I am iterested in:" name="officeHoursInterestedIn" warning={false} placeholder="Add topics, keywords" />
          </div>
          <div className={s.row}>
            <FormTagsInput selectLabel="I can help with:" name="officeHoursCanHelpWith" warning={false} placeholder="Add expertise, keywords" />
          </div>
        </div>
        <EditOfficeHoursMobileControls />
      </form>
    </FormProvider>
  );
};
