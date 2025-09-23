import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { TEditInvestorProfileForm } from '@/components/page/member-details/InvestorProfileDetails/types';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
import { EditOfficeHoursMobileControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursMobileControls';
import { FormSelect } from '@/components/form/FormSelect';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { FormCurrencyField } from '@/components/form/FormCurrencyField';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import { Checkbox } from '@base-ui-components/react/checkbox';
import Link from 'next/link';
import { useUpdateInvestorProfile } from '@/services/members/hooks/useUpdateInvestorProfile';
import { useTeamsFormOptions } from '@/services/teams/hooks/useTeamsFormOptions';

import { editInvestorProfileSchema } from './schema';
import { investorTypeOptions } from './constants';
import { formatNumberToCurrency } from './utils';
import { CheckIcon, ExternalLinkIcon, InfoIcon, LinkIcon } from './icons';
import s from './EditInvestorProfileForm.module.scss';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

export const EditInvestorProfileForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();
  const updateInvestorProfileMutation = useUpdateInvestorProfile();

  const { data: options } = useTeamsFormOptions();

  const hasTeam = member?.teams?.length > 0;

  const methods = useForm<TEditInvestorProfileForm>({
    defaultValues: {
      type: member.investorProfile?.type
        ? investorTypeOptions.find((item) => item.value === member?.investorProfile?.type)
        : investorTypeOptions[0],
      typicalCheckSize: formatNumberToCurrency(member.investorProfile?.typicalCheckSize) || '',
      investmentFocusAreas: member.investorProfile?.investmentFocus || [],
      investInStartupStages:
        member.investorProfile?.investInStartupStages?.map((item) => ({ label: item, value: item })) || [],
      investInFundTypes: member.investorProfile?.investInFundTypes?.map((item) => ({ label: item, value: item })) || [],
      secRulesAccepted: member.investorProfile?.secRulesAccepted ?? false,
      investThroughFund: member.investorProfile?.investThroughFund ?? false,
    },
    resolver: yupResolver(editInvestorProfileSchema),
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
  const type = watch('type');
  const secRulesAccepted = watch('secRulesAccepted');
  const investThroughFund = watch('investThroughFund');

  const formOptions = useMemo(() => {
    if (!options) {
      return {
        industryTagsOptions: [],
        fundingStageOptions: [],
        teamTechnologiesOptions: [],
      };
    }

    return {
      industryTagsOptions: options.industryTags.map((val: { id: any; name: any }) => ({
        value: val.name,
        label: val.name,
      })),
      fundingStageOptions: [
        ...options.fundingStage
          .filter((val: { id: any; name: any }) => val.name !== 'Not Applicable')
          .map((val: { id: any; name: any }) => ({
            value: val.name,
            label: val.name,
          })),
        { value: 'Series D and later', label: 'Series D and later' },
      ],
      teamTechnologiesOptions: options.technologies.map((val: { id: any; name: any }) => ({
        value: val.name,
        label: val.name,
      })),
    };
  }, [options]);

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
          type: formData.type?.value,
          investmentFocus: formData.investmentFocusAreas,
          typicalCheckSize: typicalCheckSizeNumber,
          investInStartupStages: formData.investInStartupStages.map((item) => item.label),
          investInFundTypes: formData.investInFundTypes.map((item) => item.label),
          secRulesAccepted: formData.secRulesAccepted,
          investThroughFund: formData.investThroughFund,
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
          <div className={s.block}>
            <div className={s.row}>
              <FormSelect
                name="type"
                label="Do you angel invest or invest through fund(s)?"
                placeholder="Select investment type"
                options={investorTypeOptions}
                isRequired
              />
            </div>
          </div>

          {type && type.value === 'ANGEL' && (
            <>
              <div className={s.block}>
                <div className={s.sectionHeader}>
                  <h3>Your Angel Investor Profile</h3>
                </div>
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

                {secRulesAccepted && (
                  <>
                    <div className={s.row}>
                      <FormMultiSelect
                        name="investInStartupStages"
                        label="Do you invest in Startups?"
                        placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A…)"
                        options={formOptions.fundingStageOptions}
                        showNone
                        isRequired
                      />
                    </div>
                    {/*<div className={s.row}>*/}
                    {/*  <FormMultiSelect*/}
                    {/*    name="investInFundTypes"*/}
                    {/*    label="Do you invest in VC Funds?"*/}
                    {/*    placeholder="Select fund types (e.g., Early stage, Late stage, Fund-of-funds)"*/}
                    {/*    options={investInVcFundsOptions}*/}
                    {/*    disabled={!secRulesAccepted}*/}
                    {/*    showNone*/}
                    {/*    noneLabel="I don’t invest in VC Funds"*/}
                    {/*    isRequired={secRulesAccepted && !investThroughFund}*/}
                    {/*  />*/}
                    {/*</div>*/}
                    <div className={s.row}>
                      <FormCurrencyField
                        name="typicalCheckSize"
                        label="Typical Check Size"
                        placeholder="Enter typical check size"
                        currency="USD"
                        disabled={!secRulesAccepted}
                        isRequired={secRulesAccepted && !investThroughFund}
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
                  </>
                )}
              </div>
              <div className={s.block}>
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

              {/*<div className={s.row}>*/}
              {/*  <label className={s.Label}>*/}
              {/*    <Checkbox.Root*/}
              {/*      className={s.Checkbox}*/}
              {/*      checked={investThroughFund}*/}
              {/*      onCheckedChange={(v: boolean) => {*/}
              {/*        setValue('investThroughFund', v, { shouldValidate: true, shouldDirty: true });*/}
              {/*        trigger();*/}
              {/*      }}*/}
              {/*    >*/}
              {/*      <Checkbox.Indicator className={s.Indicator}>*/}
              {/*        <CheckIcon className={s.Icon} />*/}
              {/*      </Checkbox.Indicator>*/}
              {/*    </Checkbox.Root>*/}
              {/*    <div className={s.col}>*/}
              {/*      <div className={s.primary}>*/}
              {/*        I invest through a venture fund.{' '}*/}
              {/*        {member.mainTeam ? (*/}
              {/*          <Link target="_blank" href="/teams/add" className={s.link}>*/}
              {/*            Submit your fund team <ExternalLinkIcon />*/}
              {/*          </Link>*/}
              {/*        ) : (*/}
              {/*          ''*/}
              {/*        )}*/}
              {/*      </div>*/}
              {/*      <p className={s.desc}>*/}
              {/*        We’ll use your fund’s profile for check size, stages, and focus. The personal fields below are*/}
              {/*        optional.*/}
              {/*      </p>*/}
              {/*    </div>*/}
              {/*  </label>*/}
              {/*</div>*/}
            </>
          )}

          {type && type.value === 'FUND' && (
            <>
              <div className={s.sectionHeader}>
                <h3>Your Investment Fund Profile</h3>
                <p>We use your fund’s profile for check size, stages, and focus.</p>

                <div className={s.infoSectionLabel}>Verify your team profile details</div>
                {hasTeam ? (
                  <>
                    <Link href={`/teams/${member?.mainTeam?.id}`} className={s.ctaLink}>
                      <div className={s.infoSectionContent}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={member?.mainTeam?.logo} alt="team logo" className={s.teamLogo} />
                        {member?.mainTeam?.name}
                        <LinkIcon />
                      </div>
                    </Link>
                  </>
                ) : (
                  <>
                    <div className={s.infoSectionContent}>
                      We don’t see a whitelisted fund associated with your account.{' '}
                      <Link href="/teams/add" className={s.ctaLink}>
                        Submit a Fund <LinkIcon />
                      </Link>
                    </div>
                  </>
                )}
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
                  <p>Choose if you&apos;d like to receive event invitations, dealflow intros, and digests.</p>
                </div>
              </Link>
            </>
          )}

          {type && type.value === 'ANGEL_AND_FUND' && (
            <>
              <div className={s.sectionHeader}>
                <h3>Your Investment Fund Profile</h3>
                <p>We use your fund&apos;s profile for check size, stages, and focus.</p>

                {hasTeam ? (
                  <>
                    <Link href={`/teams/${member?.mainTeam?.id}`} className={s.ctaLink}>
                      <div className={s.infoSectionContent}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={member?.mainTeam?.logo} alt="team logo" className={s.teamLogo} />
                        {member?.mainTeam?.name}
                        <LinkIcon />
                      </div>
                    </Link>
                  </>
                ) : (
                  <>
                    <div className={s.infoSectionContent}>
                      We don’t see a whitelisted fund associated with your account.{' '}
                      <Link href="/teams/add" className={s.ctaLink}>
                        Submit a Fund <LinkIcon />
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <div className={s.sectionHeader}>
                <h3>Your Angel Investor Profile</h3>
              </div>
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
                  </div>
                </label>
              </div>

              {secRulesAccepted && (
                <>
                  <div className={s.row}>
                    <FormMultiSelect
                      name="investInStartupStages"
                      label="Do you invest in Startups?"
                      placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A…)"
                      options={formOptions.fundingStageOptions}
                      showNone
                      isRequired
                    />
                  </div>
                  <div className={s.row}>
                    <FormCurrencyField
                      name="typicalCheckSize"
                      label="Typical Check Size"
                      placeholder="Enter typical check size"
                      currency="USD"
                      isRequired
                    />
                  </div>
                  <div className={s.row}>
                    <FormTagsInput
                      selectLabel="Add Investment Focus"
                      name="investmentFocusAreas"
                      placeholder="Enter focus area"
                    />
                  </div>
                </>
              )}

              <div className={s.divider} />

              <Link href="/settings/email" className={s.cta}>
                <div className={s.ctaIcon}>
                  <InfoIcon />
                </div>
                <div className={s.col}>
                  <div className={s.ctaLink}>
                    Manage your investor communications <LinkIcon />
                  </div>
                  <p>Choose if you&apos;d like to receive event invitations, dealflow intros, and digests.</p>
                </div>
              </Link>
            </>
          )}
        </div>
        <EditOfficeHoursMobileControls />
      </form>
    </FormProvider>
  );
};
