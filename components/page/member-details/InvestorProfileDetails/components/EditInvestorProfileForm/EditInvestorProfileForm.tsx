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
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { useUpdateMember } from '@/services/members/hooks/useUpdateMember';
import { useMember } from '@/services/members/hooks/useMember';
import { formatPayload } from '@/components/page/member-details/TeamsDetails/components/EditTeamForm';
import { ITeam } from '@/types/teams.types';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

const findPreferredTeam = (teams: ITeam[] | undefined): ITeam | undefined => {
  if (!teams || teams.length === 0) return undefined;

  // First priority: Find fund team
  const fundTeam = teams.find((team) => team.isFund);
  if (fundTeam) return fundTeam;

  // Second priority: Find main team
  const mainTeam = teams.find((team) => team.mainTeam);
  if (mainTeam) return mainTeam;

  // Fallback: Return first team
  return teams[0];
};

export const EditInvestorProfileForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();
  const updateInvestorProfileMutation = useUpdateInvestorProfile();

  const { data: options } = useTeamsFormOptions();
  const { data } = useMemberFormOptions();
  const { data: memberData } = useMember(member.id);
  const { mutateAsync, isPending } = useUpdateMember();

  const fundTeam = findPreferredTeam(member?.teams);

  const methods = useForm<TEditInvestorProfileForm>({
    defaultValues: {
      type: member.investorProfile?.type
        ? investorTypeOptions.find((item) => item.value === member?.investorProfile?.type)
        : investorTypeOptions[0],
      team: fundTeam?.name ? { label: fundTeam.name, value: fundTeam.id } : null,
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

    if (!memberData) {
      return;
    }

    // Parse the currency string to get numeric value
    const typicalCheckSizeNumber = parseCurrencyToNumber(formData.typicalCheckSize ?? '');
    try {
      if (formData.team && !member.teams.length) {
        const payload = {
          participantType: 'MEMBER',
          referenceUid: member.id,
          uniqueIdentifier: member.email,
          newData: formatPayload(memberData.memberInfo, { name: formData.team, role: '', url: '' }, true),
        };

        await mutateAsync({
          uid: memberData.memberInfo.uid,
          payload,
        });
      }

      const payload = {
        investorProfile: {
          type: formData.type?.value,
          investmentFocus: formData.secRulesAccepted ? formData.investmentFocusAreas : [],
          typicalCheckSize: formData.secRulesAccepted ? typicalCheckSizeNumber : null,
          investInStartupStages: formData.secRulesAccepted
            ? formData.investInStartupStages.map((item) => item.label)
            : [],
          // investInFundTypes: formData.investInFundTypes.map((item) => item.label),
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
            </>
          )}

          {type && type.value === 'FUND' && (
            <>
              <div className={s.block}>
                <div className={s.sectionHeader}>
                  <h3>Your Investment Fund Profile</h3>
                  {fundTeam ? (
                    <>
                      <Link href={`/teams/${fundTeam?.id}`} className={s.ctaLink}>
                        <div className={s.infoSectionContent}>
                          Verify your team profile details: <b>{fundTeam?.name}</b> <LinkIcon />
                        </div>
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className={s.infoSectionContent}>
                        <FormSelect
                          name="team"
                          placeholder="Enter your team"
                          backLabel="Teams"
                          label="Team"
                          options={
                            data?.teams.map((item: { teamUid: string; teamTitle: string }) => ({
                              value: item.teamUid,
                              label: item.teamTitle,
                            })) ?? []
                          }
                          notFoundContent={
                            <div className={s.secondaryLabel}>
                              If you don&apos;t see your team on this list, please{' '}
                              <Link href="/teams/add" className={s.link} target="_blank">
                                add your team
                              </Link>{' '}
                              first.
                            </div>
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
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
                    <p>Choose if you&apos;d like to receive event invitations, dealflow intros, and digests.</p>
                  </div>
                </Link>
              </div>
            </>
          )}

          {type && type.value === 'ANGEL_AND_FUND' && (
            <>
              <div className={s.block}>
                <div className={s.sectionHeader}>
                  <h3>Your Investment Fund Profile</h3>
                  {fundTeam ? (
                    <>
                      <Link href={`/teams/${fundTeam?.id}`} className={s.ctaLink}>
                        <div className={s.infoSectionContent}>
                          Verify your team profile details: <b>{fundTeam?.name}</b> <LinkIcon />
                        </div>
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className={s.infoSectionContent}>
                        <FormSelect
                          name="team"
                          placeholder="Enter your team"
                          backLabel="Teams"
                          label="Team"
                          options={
                            data?.teams.map((item: { teamUid: string; teamTitle: string }) => ({
                              value: item.teamUid,
                              label: item.teamTitle,
                            })) ?? []
                          }
                          notFoundContent={
                            <div className={s.secondaryLabel}>
                              If you don&apos;t see your team on this list, please{' '}
                              <Link href="/teams/add" className={s.link} target="_blank">
                                add your team
                              </Link>{' '}
                              first.
                            </div>
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

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
                    <p>Choose if you&apos;d like to receive event invitations, dealflow intros, and digests.</p>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
        <EditOfficeHoursMobileControls />
      </form>
    </FormProvider>
  );
};
