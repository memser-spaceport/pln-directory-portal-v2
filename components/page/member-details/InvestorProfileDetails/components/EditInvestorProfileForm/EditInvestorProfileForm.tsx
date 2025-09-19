import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { TEditInvestorProfileForm } from '@/components/page/member-details/InvestorProfileDetails/types';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
import { EditOfficeHoursMobileControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursMobileControls';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import * as yup from 'yup';

import s from './EditInvestorProfileForm.module.scss';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { useUpdateInvestorProfile } from '@/services/members/hooks/useUpdateInvestorProfile';
import { FormCurrencyField } from '@/components/form/FormCurrencyField';
import { Checkbox } from '@base-ui-components/react/checkbox';
import Link from 'next/link';
import { useTeamsFormOptions } from '@/services/teams/hooks/useTeamsFormOptions';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

const schema = yup.object().shape({
  typicalCheckSize: yup.string().when('secRulesAccepted', {
    is: true,
    then: () => yup.string().required('Required'),
  }),
  investmentFocusAreas: yup
    .array()
    .of(yup.string().required())
    .when('secRulesAccepted', {
      is: true,
      then: () => yup.array().of(yup.string().required()).min(1, 'Required'),
    })
    .defined(),
  investToStartups: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .defined(),
  investInVcFunds: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .defined(),
  secRulesAccepted: yup.boolean().required('Required'),
});

export const EditInvestorProfileForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();
  const updateInvestorProfileMutation = useUpdateInvestorProfile();

  const investInVcFundsOptions = [
    { label: 'Early stage', value: 'early-stage' },
    { label: 'Late stage', value: 'late-stage' },
    { label: 'Fund-of-funds', value: 'fund-of-funds' },
  ];

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
      investToStartups: member.investorProfile?.investToStartups || [],
      investInVcFunds: member.investorProfile?.investInVcFunds || [],
      secRulesAccepted: member.investorProfile?.secRulesAccepted ?? false,
    },
    // @ts-ignore
    resolver: yupResolver(schema),
    mode: 'all',
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid },
  } = methods;
  const secRulesAccepted = watch('secRulesAccepted');

  const { data } = useTeamsFormOptions();

  const options = useMemo(() => {
    if (!data) {
      return {
        industryTagsOptions: [],
        fundingStageOptions: [],
        teamTechnologiesOptions: [],
      };
    }

    return {
      industryTagsOptions: data.industryTags.map((val: { id: any; name: any }) => ({
        value: val.name,
        label: val.name,
      })),
      fundingStageOptions: data.fundingStage
        .filter((val: { id: any; name: any }) => val.name !== 'Not Applicable')
        .map((val: { id: any; name: any }) => ({
          value: val.name,
          label: val.name,
        })),
      teamTechnologiesOptions: data.technologies.map((val: { id: any; name: any }) => ({
        value: val.name,
        label: val.name,
      })),
    };
  }, [data]);

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
    const typicalCheckSizeNumber = parseCurrencyToNumber(formData.typicalCheckSize ?? '');

    try {
      const payload = {
        investorProfile: {
          investmentFocus: formData.investmentFocusAreas,
          typicalCheckSize: typicalCheckSizeNumber,
          investToStartups: formData.investToStartups,
          investInVcFunds: formData.investInVcFunds,
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
        // @ts-ignore
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
                  trigger();
                }}
              >
                <Checkbox.Indicator className={s.Indicator}>
                  <CheckIcon className={s.Icon} />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <div className={s.col}>
                <div className={s.primary}>
                  I&apos;m an accredited investor under{' '}
                  <Link
                    target="_blank"
                    href="https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated-3"
                    className={s.link}
                  >
                    SEC rules <ExternalLinkIcon />
                  </Link>
                </div>
                {/*<p className={s.desc}>*/}
                {/*  This certification is required to access investor features and participate in demo days. You must*/}
                {/*  confirm accredited investor status to save your investor profile.*/}
                {/*</p>*/}
              </div>
            </label>
          </div>
          <div className={s.row}>
            <FormMultiSelect
              name="investToStartups"
              label="Do you invest in Startups?"
              placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A…)"
              options={options.fundingStageOptions}
              disabled={!secRulesAccepted}
              showNone
            />
          </div>
          <div className={s.row}>
            <FormMultiSelect
              name="investInVcFunds"
              label="Do you invest in VC Funds?"
              placeholder="Select fund types (e.g., Early stage, Late stage, Fund-of-funds)"
              options={investInVcFundsOptions}
              disabled={!secRulesAccepted}
              showNone
            />
          </div>
          <div className={s.row}>
            <FormCurrencyField
              name="typicalCheckSize"
              label="Typical Check Size"
              placeholder="Enter typical check size"
              currency="USD"
              disabled={!secRulesAccepted}
            />
          </div>
          <div className={s.row}>
            <FormTagsInput
              selectLabel="Add Investment Focus"
              name="investmentFocusAreas"
              placeholder="Enter focus area"
              disabled={!secRulesAccepted}
            />
          </div>

          <div className={s.divider} />

          <Link href="/settings/email" className={s.cta}>
            <div className={s.ctaIcon}>
              <InfoIcon />
            </div>
            <div className={s.col}>
              <div className={s.ctaLink}>
                Manage your investor communications <LinkIcon />
              </div>
              <p>Choose if you’d like to receive event invitations, dealflow intros, and digests.</p>
            </div>
          </Link>
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

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2.25C10.0716 2.25 8.18657 2.82183 6.58319 3.89317C4.97982 4.96451 3.73013 6.48726 2.99218 8.26884C2.25422 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7934 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.7473 9.41498 20.7192 6.93661 18.8913 5.10872C17.0634 3.28084 14.585 2.25273 12 2.25ZM12 20.25C10.3683 20.25 8.77326 19.7661 7.41655 18.8596C6.05984 17.9531 5.00242 16.6646 4.378 15.1571C3.75358 13.6496 3.5902 11.9908 3.90853 10.3905C4.22685 8.79016 5.01259 7.32015 6.16637 6.16637C7.32016 5.01259 8.79017 4.22685 10.3905 3.90852C11.9909 3.59019 13.6497 3.75357 15.1571 4.37799C16.6646 5.00242 17.9531 6.05984 18.8596 7.41655C19.7661 8.77325 20.25 10.3683 20.25 12C20.2475 14.1873 19.3775 16.2843 17.8309 17.8309C16.2843 19.3775 14.1873 20.2475 12 20.25ZM13.5 16.5C13.5 16.6989 13.421 16.8897 13.2803 17.0303C13.1397 17.171 12.9489 17.25 12.75 17.25C12.3522 17.25 11.9706 17.092 11.6893 16.8107C11.408 16.5294 11.25 16.1478 11.25 15.75V12C11.0511 12 10.8603 11.921 10.7197 11.7803C10.579 11.6397 10.5 11.4489 10.5 11.25C10.5 11.0511 10.579 10.8603 10.7197 10.7197C10.8603 10.579 11.0511 10.5 11.25 10.5C11.6478 10.5 12.0294 10.658 12.3107 10.9393C12.592 11.2206 12.75 11.6022 12.75 12V15.75C12.9489 15.75 13.1397 15.829 13.2803 15.9697C13.421 16.1103 13.5 16.3011 13.5 16.5ZM10.5 7.875C10.5 7.6525 10.566 7.43499 10.6896 7.24998C10.8132 7.06498 10.9889 6.92078 11.1945 6.83564C11.4001 6.75049 11.6263 6.72821 11.8445 6.77162C12.0627 6.81502 12.2632 6.92217 12.4205 7.0795C12.5778 7.23684 12.685 7.43729 12.7284 7.65552C12.7718 7.87375 12.7495 8.09995 12.6644 8.30552C12.5792 8.51109 12.435 8.68679 12.25 8.8104C12.065 8.93402 11.8475 9 11.625 9C11.3266 9 11.0405 8.88147 10.8295 8.6705C10.6185 8.45952 10.5 8.17337 10.5 7.875Z"
      fill="#455468"
    />
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.75 4V10.5C12.75 10.6989 12.671 10.8897 12.5303 11.0303C12.3896 11.171 12.1989 11.25 12 11.25C11.8011 11.25 11.6103 11.171 11.4696 11.0303C11.329 10.8897 11.25 10.6989 11.25 10.5V5.8125L4.5306 12.5306C4.3897 12.6715 4.19861 12.7507 3.99935 12.7507C3.80009 12.7507 3.60899 12.6715 3.4681 12.5306C3.3272 12.3897 3.24805 12.1986 3.24805 11.9994C3.24805 11.8001 3.3272 11.609 3.4681 11.4681L10.1875 4.75H5.49997C5.30106 4.75 5.11029 4.67098 4.96964 4.53033C4.82899 4.38968 4.74997 4.19891 4.74997 4C4.74997 3.80109 4.82899 3.61032 4.96964 3.46967C5.11029 3.32902 5.30106 3.25 5.49997 3.25H12C12.1989 3.25 12.3896 3.32902 12.5303 3.46967C12.671 3.61032 12.75 3.80109 12.75 4Z"
      fill="#455468"
    />
  </svg>
);
