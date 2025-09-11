import React from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { TEditInvestorProfileForm } from '@/components/page/member-details/InvestorProfileDetails/types';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
import { EditOfficeHoursMobileControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursMobileControls';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import * as yup from 'yup';

import s from './EditInvestorProfileForm.module.scss';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { useUpdateInvestorProfile } from '@/services/members/hooks/useUpdateInvestorProfile';
import { FormCurrencyField } from '@/components/form/FormCurrencyField';
import { Checkbox } from '@base-ui-components/react/checkbox';
import Link from 'next/link';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

const schema = yup.object().shape({
  typicalCheckSize: yup.string().required('Required'),
  investmentFocusAreas: yup.array().of(yup.string().required()).min(1, 'Required').defined(),
  secRulesAccepted: yup.boolean().required('Required'),
});

export const EditInvestorProfileForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();
  const updateInvestorProfileMutation = useUpdateInvestorProfile();

  // Helper function to format number to currency string for initial display
  const formatNumberToCurrency = (value: string | number | undefined): string => {
    if (!value) return '';

    // Convert to number if it's a string
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    // Return empty string if not a valid number
    if (isNaN(numericValue)) return '';

    // Format as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const methods = useForm<TEditInvestorProfileForm>({
    defaultValues: {
      typicalCheckSize: formatNumberToCurrency(member.investorProfile?.typicalCheckSize) || '',
      investmentFocusAreas: member.investorProfile?.investmentFocus || [],
      secRulesAccepted: member.investorProfile?.secRulesAccepted ?? false,
    },
    resolver: yupResolver(schema),
    mode: 'all',
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = methods;
  const secRulesAccepted = watch('secRulesAccepted');

  // Helper function to parse currency string to number
  const parseCurrencyToNumber = (currencyString: string): number => {
    // Remove all non-numeric characters except decimal point
    const numericString = currencyString.replace(/[^\d.]/g, '');

    // Convert to number
    const numericValue = parseFloat(numericString);

    // Return 0 if parsing failed
    return isNaN(numericValue) ? 0 : numericValue;
  };

  const onSubmit = async (formData: TEditInvestorProfileForm) => {
    if (!isValid) {
      return;
    }

    // Parse the currency string to get numeric value
    const typicalCheckSizeNumber = parseCurrencyToNumber(formData.typicalCheckSize);

    try {
      const payload = {
        investorProfile: {
          investmentFocus: formData.investmentFocusAreas,
          typicalCheckSize: typicalCheckSizeNumber,
          secRulesAccepted: formData.secRulesAccepted,
        },
      };

      await updateInvestorProfileMutation.mutateAsync({ memberUid: member.id, payload });

      toast.success('Investor profile updated successfully!');
      router.refresh();
      reset();
      onClose();
    } catch (error) {
      console.error('Error updating investor profile:', error);
      toast.error('Failed to update investor profile. Please try again.');
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
        <EditOfficeHoursFormControls onClose={onClose} title="Edit Investor Profile" />
        <div className={s.body}>
          <div className={s.row}>
            <label className={s.Label}>
              <Checkbox.Root
                className={s.Checkbox}
                checked={secRulesAccepted}
                onCheckedChange={(v: boolean) => {
                  setValue('secRulesAccepted', v, { shouldValidate: true, shouldDirty: true });
                }}
              >
                <Checkbox.Indicator className={s.Indicator}>
                  <CheckIcon className={s.Icon} />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <div className={s.primary}>
                I&apos;m an accredited investor under{' '}
                <Link target="_blank" href="https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated-3" className={s.link}>
                  SEC rules <ExternalLinkIcon />
                </Link>
              </div>
            </label>
          </div>
          <div className={s.row}>
            <FormCurrencyField name="typicalCheckSize" label="Typical Check Size" placeholder="Enter typical check size" currency="USD" disabled={!secRulesAccepted} />
          </div>
          <div className={s.row}>
            <FormTagsInput selectLabel="Add Investment Focus Area" name="investmentFocusAreas" placeholder="Enter focus area" disabled={!secRulesAccepted} />
          </div>
        </div>
        <EditOfficeHoursMobileControls />
      </form>
    </FormProvider>
  );
};

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ExternalLinkIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14.25 6.5C14.25 6.69891 14.171 6.88968 14.0303 7.03033C13.8897 7.17098 13.6989 7.25 13.5 7.25C13.3011 7.25 13.1103 7.17098 12.9697 7.03033C12.829 6.88968 12.75 6.69891 12.75 6.5V4.3125L9.03063 8.03187C8.88973 8.17277 8.69863 8.25193 8.49938 8.25193C8.30012 8.25193 8.10902 8.17277 7.96812 8.03187C7.82723 7.89098 7.74807 7.69988 7.74807 7.50063C7.74807 7.30137 7.82723 7.11027 7.96812 6.96938L11.6875 3.25H9.5C9.30109 3.25 9.11032 3.17098 8.96967 3.03033C8.82902 2.88968 8.75 2.69891 8.75 2.5C8.75 2.30109 8.82902 2.11032 8.96967 1.96967C9.11032 1.82902 9.30109 1.75 9.5 1.75H13.5C13.6989 1.75 13.8897 1.82902 14.0303 1.96967C14.171 2.11032 14.25 2.30109 14.25 2.5V6.5ZM11.5 8C11.3011 8 11.1103 8.07902 10.9697 8.21967C10.829 8.36032 10.75 8.55109 10.75 8.75V12.75H3.25V5.25H7.25C7.44891 5.25 7.63968 5.17098 7.78033 5.03033C7.92098 4.88968 8 4.69891 8 4.5C8 4.30109 7.92098 4.11032 7.78033 3.96967C7.63968 3.82902 7.44891 3.75 7.25 3.75H3C2.66848 3.75 2.35054 3.8817 2.11612 4.11612C1.8817 4.35054 1.75 4.66848 1.75 5V13C1.75 13.3315 1.8817 13.6495 2.11612 13.8839C2.35054 14.1183 2.66848 14.25 3 14.25H11C11.3315 14.25 11.6495 14.1183 11.8839 13.8839C12.1183 13.6495 12.25 13.3315 12.25 13V8.75C12.25 8.55109 12.171 8.36032 12.0303 8.21967C11.8897 8.07902 11.6989 8 11.5 8Z"
        fill="#1B4DFF"
      />
    </svg>
  );
}
