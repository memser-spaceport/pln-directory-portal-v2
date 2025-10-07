import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from '@/components/core/ToastContainer';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';

import { IMember, InvestorProfileType } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { TEditInvestorProfileForm } from '@/components/page/member-details/InvestorProfileDetails/types';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
import { EditOfficeHoursMobileControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursMobileControls';
import { FormSelect } from '@/components/form/FormSelect';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { FormCurrencyField } from '@/components/form/FormCurrencyField';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import { FormField } from '@/components/form/FormField';
import { Checkbox } from '@base-ui-components/react/checkbox';
import Link from 'next/link';
import { useUpdateInvestorProfile } from '@/services/members/hooks/useUpdateInvestorProfile';
import { useUpdateTeamInvestorProfile } from '@/services/teams/hooks/useUpdateTeamInvestorProfile';
import { useTeamsFormOptions } from '@/services/teams/hooks/useTeamsFormOptions';

import { editInvestorProfileSchema } from './schema';
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
  const updateTeamInvestorProfileMutation = useUpdateTeamInvestorProfile();

  // Analytics hooks
  const { onInvestorProfileUpdated } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  const { data: options } = useTeamsFormOptions();
  const { data } = useMemberFormOptions();
  const { data: memberData } = useMember(member.id);
  const { mutateAsync, isPending } = useUpdateMember();

  const fundTeam = findPreferredTeam(member?.teams);

  const methods = useForm<TEditInvestorProfileForm>({
    defaultValues: {
      // type: member.investorProfile?.type
      //   ? investorTypeOptions.find((item) => item.value === member?.investorProfile?.type)
      //   : investorTypeOptions[0],
      secRulesAccepted: member.investorProfile?.secRulesAccepted ?? false,
      isInvestViaFund:
        member.investorProfile?.type === 'FUND' || member.investorProfile?.type === 'ANGEL_AND_FUND' || false,

      team: fundTeam?.name ? { label: fundTeam.name, value: fundTeam.id } : null,

      typicalCheckSize: formatNumberToCurrency(member.investorProfile?.typicalCheckSize) || '',
      investmentFocusAreas: member.investorProfile?.investmentFocus || [],
      investInStartupStages:
        member.investorProfile?.investInStartupStages?.map((item) => ({ label: item, value: item })) || [],
      investInFundTypes: member.investorProfile?.investInFundTypes?.map((item) => ({ label: item, value: item })) || [],

      teamRole: fundTeam?.role || '',
      teamInvestInFundTypes:
        fundTeam?.investorProfile?.investInFundTypes?.map((item) => ({ label: item, value: item })) || [],
      teamInvestInStartupStages:
        fundTeam?.investorProfile?.investInStartupStages?.map((item) => ({ label: item, value: item })) || [],
      teamTypicalCheckSize: formatNumberToCurrency(fundTeam?.investorProfile?.typicalCheckSize) || '',
      teamInvestmentFocusAreas: fundTeam?.investorProfile?.investmentFocus || [],
    },
    resolver: yupResolver(editInvestorProfileSchema),
    mode: 'all',
  });

  const {
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    trigger,
    formState: { errors, isValid },
  } = methods;
  const secRulesAccepted = watch('secRulesAccepted');
  const isInvestViaFund = watch('isInvestViaFund');
  const selectedTeam = watch('team');

  const isTeamLead = member?.teams.find((team) => team.id === selectedTeam?.value)?.teamLead;

  const formOptions = useMemo(() => {
    if (!options) {
      return {
        industryTagsOptions: [],
        fundingStageOptions: [],
        teamTechnologiesOptions: [],
        fundTypeOptions: [],
      };
    }

    return {
      industryTagsOptions: options.industryTags.map((val: { id: any; name: any }) => ({
        value: val.name,
        label: val.name,
      })),
      fundingStageOptions: [
        ...options.fundingStage
          .filter(
            (val: { id: any; name: any }) =>
              val.name !== 'Not Applicable' &&
              val.name !== 'Series D' &&
              val.name !== 'Series E' &&
              val.name !== 'None',
          )
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
      fundTypeOptions: [
        { label: 'Early stage', value: 'Early stage' },
        { label: 'Late stage', value: 'Late stage' },
        { label: 'Fund-of-funds', value: 'Fund-of-funds' },
      ],
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

  const handleAddTeamLinkClick = () => {
    if (userInfo?.email) {
      // Custom analytics event
      const addTeamLinkEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_ADD_TEAM_LINK_CLICKED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: `/members/${member.id}`,
          timestamp: new Date().toISOString(),
        },
      };

      reportAnalytics.mutate(addTeamLinkEvent);
    }
  };

  const handleTeamSelect = (selectedTeam: { label: string; value: string } | null) => {
    reset({
      ...getValues(),
      teamRole: '',
      teamInvestInFundTypes: [],
      teamInvestInStartupStages: [],
      teamTypicalCheckSize: '',
      teamInvestmentFocusAreas: [],
    });

    if (selectedTeam && userInfo?.email) {
      // Custom analytics event
      const teamSelectedEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_TEAM_SELECTED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: `/members/${member.id}`,
          timestamp: new Date().toISOString(),
          teamId: selectedTeam.value,
          teamName: selectedTeam.label,
        },
      };

      reportAnalytics.mutate(teamSelectedEvent);
    }
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
    const teamTypicalCheckSizeNumber = parseCurrencyToNumber(formData.teamTypicalCheckSize ?? '');

    try {
      if (formData.team) {
        const teamPayload = {
          role: formData.teamRole,
          investmentTeam: true,
          isFund: true,
          investorProfile: {
            investmentFocus: formData.teamInvestmentFocusAreas,
            investInStartupStages: formData.teamInvestInStartupStages.map((item) => item.value),
            investInFundTypes: formData.teamInvestInFundTypes.map((item) => item.value),
            typicalCheckSize: teamTypicalCheckSizeNumber,
          },
        };

        await updateTeamInvestorProfileMutation.mutateAsync({
          teamUid: formData.team.value,
          payload: teamPayload,
        });

        const payload = {
          participantType: 'MEMBER',
          referenceUid: member.id,
          uniqueIdentifier: member.email,
          newData: formatPayload(
            memberData.memberInfo,
            { name: formData.team, role: formData.teamRole, url: '' },
            true,
          ),
        };

        await mutateAsync({
          uid: memberData.memberInfo.uid,
          payload,
        });
      }

      const payload = {
        investorProfile: {
          type: deriveType(formData),
          investmentFocus: formData.secRulesAccepted ? formData.investmentFocusAreas : [],
          typicalCheckSize: formData.secRulesAccepted ? typicalCheckSizeNumber : null,
          investInStartupStages: formData.secRulesAccepted
            ? formData.investInStartupStages.map((item) => item.label)
            : [],
          // investInFundTypes: formData.investInFundTypes.map((item) => item.label),
          secRulesAccepted: formData.secRulesAccepted,
          isInvestViaFund: formData.isInvestViaFund,
        },
      };

      await updateInvestorProfileMutation.mutateAsync({ memberUid: member.id, payload });

      // Report successful profile update analytics
      if (userInfo?.email) {
        // PostHog analytics
        onInvestorProfileUpdated();

        // Custom analytics event
        const profileUpdatedEvent: TrackEventDto = {
          name: DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_UPDATED,
          distinctId: userInfo.email,
          properties: {
            userId: userInfo.uid,
            userEmail: userInfo.email,
            userName: userInfo.name,
            path: `/members/${member.id}`,
            timestamp: new Date().toISOString(),
            hasInvestmentFocus: formData.investmentFocusAreas?.length > 0,
            hasTypicalCheckSize: !!formData.typicalCheckSize,
            secRulesAccepted: formData.secRulesAccepted,
            isInvestViaFund: formData.isInvestViaFund,
            fieldsUpdated: Object.keys(formData).filter((key) => formData[key as keyof typeof formData] !== undefined),
          },
        };

        reportAnalytics.mutate(profileUpdatedEvent);
      }

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
            <div className={s.sectionHeader}>
              <h3>How do you invest (select all that apply)?</h3>
            </div>
            <section>
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
                    I angel invest as an accredited investor under{' '}
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

              {secRulesAccepted && (
                <>
                  <div className={s.row}>
                    <FormMultiSelect
                      name="investInStartupStages"
                      label="Do you invest in Startups?"
                      placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A…)"
                      options={formOptions.fundingStageOptions}
                      // showNone
                    />
                  </div>
                  <div className={s.row}>
                    <FormCurrencyField
                      name="typicalCheckSize"
                      label="Typical Check Size"
                      placeholder="E.g. $250.000"
                      currency="USD"
                      disabled={!secRulesAccepted}
                    />
                  </div>
                  <div className={s.row}>
                    <FormTagsInput
                      selectLabel="Add Investment Focus"
                      name="investmentFocusAreas"
                      placeholder="Add keywords E.g. AI, Staking, Governance, etc."
                      disabled={!secRulesAccepted}
                    />
                  </div>

                  <div className={s.divider} />
                </>
              )}
            </section>
            <section>
              <label className={s.Label}>
                <Checkbox.Root
                  className={s.Checkbox}
                  checked={isInvestViaFund}
                  onCheckedChange={(v: boolean) => {
                    setValue('isInvestViaFund', v, { shouldValidate: true, shouldDirty: true });
                    trigger();
                  }}
                >
                  <Checkbox.Indicator className={s.Indicator}>
                    <CheckIcon className={s.Icon} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <div className={s.col}>
                  <div className={s.primary}>I invest through a fund(s).</div>
                </div>
              </label>

              {isInvestViaFund && (
                <>
                  {selectedTeam && (
                    <div className={s.fundInfoBox}>
                      <div className={s.fundInfo}>
                        <div className={s.fundAvatar}>
                          <img
                            src={
                              data?.teams.find((t: any) => t.teamUid === selectedTeam.value)?.teamLogo ||
                              '/images/demo-day/profile-placeholder.svg'
                            }
                            alt={selectedTeam.label}
                          />
                        </div>
                        <div className={s.fundDetails}>
                          <div className={s.fundName}>{selectedTeam.label}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={s.removeButton}
                        onClick={() => setValue('team', null)}
                        aria-label="Remove team"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M3.13 10.87L10.87 3.13M10.87 10.87L3.13 3.13"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className={s.infoSectionContent}>
                    <FormSelect
                      name="team"
                      backLabel="Teams"
                      placeholder="Search by org name"
                      label="Search and add an investment fund"
                      options={
                        data?.teams.map((item: { teamUid: string; teamTitle: string }) => ({
                          value: item.teamUid,
                          label: item.teamTitle,
                        })) ?? []
                      }
                      onChange={(value) => handleTeamSelect(value)}
                      notFoundContent={
                        <div className={s.secondaryLabel}>
                          If you don&apos;t see your team on this list, please{' '}
                          <Link href="/teams/add" className={s.link} target="_blank" onClick={handleAddTeamLinkClick}>
                            add your team
                          </Link>{' '}
                          first.
                        </div>
                      }
                    />
                  </div>

                  <div className={s.row}>
                    <FormField
                      name="teamRole"
                      placeholder="Enter your role"
                      label="Role"
                      disabled={!isTeamLead || !selectedTeam}
                    />
                  </div>

                  <div className={s.row}>
                    <FormMultiSelect
                      name="teamInvestInFundTypes"
                      label="Type of fund(s) you invest in?"
                      placeholder="Select fund types (e.g., Early stage, Late stage, Fund-of-funds)"
                      options={formOptions.fundTypeOptions}
                      disabled={!isTeamLead || !selectedTeam}
                    />
                  </div>

                  <div className={s.row}>
                    <FormMultiSelect
                      name="teamInvestInStartupStages"
                      label="Startup stage(s) you invest in?"
                      placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A…)"
                      options={formOptions.fundingStageOptions}
                      disabled={!isTeamLead || !selectedTeam}
                    />
                  </div>

                  <div className={s.row}>
                    <FormCurrencyField
                      name="teamTypicalCheckSize"
                      label="Typical Check Size"
                      placeholder="Select typical check size (E.g. $25k - $50.000k)"
                      currency="USD"
                      disabled={!isTeamLead || !selectedTeam}
                    />
                  </div>

                  <div className={s.row}>
                    <FormTagsInput
                      selectLabel="Add Investment Focus"
                      name="teamInvestmentFocusAreas"
                      placeholder="Add keywords. E.g. AI, Staking, Governance, etc."
                      disabled={!isTeamLead || !selectedTeam}
                    />
                  </div>
                </>
              )}
            </section>
          </div>

          {secRulesAccepted && (
            <div className={s.block}>
              <Link href="/settings/email" target="_blank" className={s.cta}>
                <div className={s.ctaIcon}>
                  <InfoIcon />
                </div>
                <div className={s.col}>
                  <div className={s.ctaLink}>
                    Manage your investor communications <LinkIcon />
                  </div>
                  <p>Email preferences for event invites, deal flow intros, and digests.</p>
                </div>
              </Link>
            </div>
          )}
        </div>
        <EditOfficeHoursMobileControls />
      </form>
    </FormProvider>
  );
};

function deriveType(formData: TEditInvestorProfileForm): InvestorProfileType | null {
  if (formData.isInvestViaFund && formData.secRulesAccepted) {
    return 'ANGEL_AND_FUND';
  } else if (formData.secRulesAccepted) {
    return 'ANGEL';
  } else if (formData.isInvestViaFund) {
    return 'FUND';
  }

  return null;
}
