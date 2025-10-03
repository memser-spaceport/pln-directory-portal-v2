import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
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
  const secRulesAccepted = watch('secRulesAccepted');
  const isInvestViaFund = watch('isInvestViaFund');

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
                  {fundTeam ? (
                    <>
                      <Link href={`/teams/${fundTeam?.id}`} className={s.ctaLink}>
                        <div className={s.infoSectionContent}>
                          Verify your team profile details: <b>{fundTeam?.name}</b>{' '}
                          <span className={s.linkIcon}>
                            <LinkIcon />
                          </span>
                        </div>
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className={s.infoSectionContent}>
                        <FormSelect
                          name="team"
                          backLabel="Teams"
                          placeholder="Search by team name"
                          label="Search and add an investment fund team"
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
                              <Link
                                href="/teams/add"
                                className={s.link}
                                target="_blank"
                                onClick={handleAddTeamLinkClick}
                              >
                                add your team
                              </Link>{' '}
                              first.
                            </div>
                          }
                        />
                      </div>
                    </>
                  )}
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
                  <p>Manage communication preferences for event invitations, deal flow intros, and digests.</p>
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
