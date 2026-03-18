import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
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
import { CheckIcon, ExternalLinkIcon, ExternalLinkIconBlue, InfoIcon, InfoIconFilled, LinkIcon } from './icons';
import s from './EditInvestorProfileForm.module.scss';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { useMember } from '@/services/members/hooks/useMember';
import { findPreferredTeam } from './utils/findPreferredTeam';
import { AddTeamDrawer } from './components/AddTeamDrawer/AddTeamDrawer';
import { useGetSaveTeam } from '@/hooks/createTeam/useGetSaveTeam';
import { Button } from '@/components/common/Button';
import { AddTeamInlineForm } from '@/components/form/AddTeamInlineForm';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { useQueryClient } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import clsx from 'clsx';
import { useContactSupportStore } from '@/services/contact-support/store';
import { TeamsQueryKeys } from '@/services/teams/constants';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
  useInlineAddTeam?: boolean;
  source?: 'investor-drawer';
}

const INVESTOR_PROFILE_FIELDS = [
  'secRulesAccepted',
  'typicalCheckSize',
  'investmentFocusAreas',
  'investInStartupStages',
  'isInvestViaFund',
  'team',
  'teamRole',
  'website',
  'teamInvestmentFocusAreas',
  'teamTypicalCheckSize',
  'teamInvestInStartupStages',
  'teamInvestInFundTypes',
] as const;

function formatValueForAnalytics(value: unknown): unknown {
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === 'object' &&
    value[0] !== null &&
    'value' in value[0]
  ) {
    return value.map((item: { value: string }) => item.value);
  }
  if (typeof value === 'object' && value !== null && 'value' in (value as object)) {
    return (value as { value: string }).value;
  }
  return value;
}

export const EditInvestorProfileForm = ({ onClose, member, userInfo, useInlineAddTeam, source }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateInvestorProfileMutation = useUpdateInvestorProfile();
  const updateTeamInvestorProfileMutation = useUpdateTeamInvestorProfile();

  const { onInvestorProfileUpdated, onInvestorDrawerInputChanged, onInvestorDrawerFormSaved } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const { openModal: openContactSupport } = useContactSupportStore((s) => s.actions);

  const { data: options } = useTeamsFormOptions();
  const { data } = useMemberFormOptions();
  const { data: memberData } = useMember(member.id);

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
      website: fundTeam?.website || '',
      teamInvestInFundTypes:
        fundTeam?.investorProfile?.investInFundTypes?.map((item) => ({ label: item, value: item })) || [],
      teamInvestInStartupStages:
        fundTeam?.investorProfile?.investInStartupStages?.map((item) => ({ label: item, value: item })) || [],
      teamTypicalCheckSize: formatNumberToCurrency(fundTeam?.investorProfile?.typicalCheckSize) || '',
      teamInvestmentFocusAreas: fundTeam?.investorProfile?.investmentFocus || [],

      newTeamName: '',
      newTeamWebsite: '',
      newTeamRole: '',
    },
    // @ts-ignore
    resolver: yupResolver(editInvestorProfileSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    context: { member },
  });

  const {
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    trigger,
    control,
    formState: { isSubmitted },
  } = methods;

  const watchedValues = useWatch({ control });
  const prevValuesRef = React.useRef<Record<string, unknown> | null>(null);
  const isInitialMountRef = React.useRef(true);

  React.useEffect(() => {
    if (source !== 'investor-drawer' || !userInfo?.email) return;
    const values = (watchedValues || {}) as Record<string, unknown>;
    if (isInitialMountRef.current) {
      prevValuesRef.current = values;
      isInitialMountRef.current = false;
      return;
    }
    const prev = prevValuesRef.current || {};
    for (const field of INVESTOR_PROFILE_FIELDS) {
      const currentVal = values[field];
      const prevVal = prev[field];
      if (JSON.stringify(currentVal) !== JSON.stringify(prevVal)) {
        onInvestorDrawerInputChanged({ field, value: formatValueForAnalytics(currentVal) });
        const inputChangedEvent: TrackEventDto = {
          name: DEMO_DAY_ANALYTICS.ON_INVESTOR_DRAWER_INPUT_CHANGED,
          distinctId: userInfo.email,
          properties: { field, value: formatValueForAnalytics(currentVal), userId: userInfo.uid },
        };
        reportAnalytics.mutate(inputChangedEvent);
      }
    }
    prevValuesRef.current = values;
  }, [watchedValues, source, userInfo?.email, userInfo?.uid, onInvestorDrawerInputChanged, reportAnalytics]);
  const secRulesAccepted = watch('secRulesAccepted');
  const isInvestViaFund = watch('isInvestViaFund');
  const selectedTeam = watch('team');

  const isTeamLead =
    member?.teams.find((team) => team.id === selectedTeam?.value)?.teamLead || selectedTeam?.originalObject?.teamLead;

  const ensureProtocol = () => {
    const val = (watch('website') as string)?.trim();
    if (val && !/^https?:\/\//i.test(val)) {
      setValue('website', `https://${val}`, { shouldValidate: true, shouldDirty: true });
    }
  };

  const [isAddTeamDrawerOpen, setIsAddTeamDrawerOpen] = React.useState(false);
  const [isAddingTeamInline, setIsAddingTeamInline] = React.useState(false);
  const teamSelectRef = React.useRef(null);

  const pendingTeamDataRef = React.useRef<any>(null);
  const createdTeamRef = React.useRef<{ uid: string; name: string } | null>(null);

  const saveTeamFn = useGetSaveTeam((newData: any) => {
    const pendingData = pendingTeamDataRef.current;
    setIsAddingTeamInline(false);

    if (newData && pendingData) {
      const teamUid = newData.uid || newData.id || newData.teamUid || '';
      const teamTitle = newData.name || newData.teamTitle || pendingData.name || '';

      // Store for use in onSubmit after await
      createdTeamRef.current = { uid: teamUid, name: teamTitle };

      const newTeamEntry = {
        teamUid,
        teamTitle,
        investorProfile: {
          investInFundTypes: pendingData.fundTypes?.map((item: any) => item.value),
          investInStartupStages: pendingData.startupStages?.map((item: any) => item.value),
          typicalCheckSize: parseCurrencyToNumber(pendingData.typicalCheckSize ?? ''),
          investmentFocus: pendingData.investmentFocusAreas,
        },
        role: '',
        logo: null,
        website: pendingData.website || newData.website || '',
        teamLead: true,
      };

      queryClient.setQueryData([MembersQueryKeys.GET_SKILLS_OPTIONS], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          teams: [...(oldData.teams || []), newTeamEntry],
        };
      });
      queryClient.invalidateQueries({
        queryKey: [TeamsQueryKeys.GET_TEAMS_FORM_OPTIONS],
      });

      const teamOption = {
        value: teamUid,
        label: teamTitle,
        originalObject: newTeamEntry,
        teamLead: true,
      };

      setValue('team', teamOption, { shouldValidate: true, shouldDirty: true });
      handleTeamSelect(teamOption);
      if (pendingData.role) {
        setValue('teamRole', pendingData.role, { shouldValidate: true, shouldDirty: true });
      }
    }
    pendingTeamDataRef.current = null;
  });

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
        { label: 'Growth', value: 'Growth' },
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

  const handleTeamCreated = (team: any) => {
    // Find the newly created team in the options by name
    // const newTeam = data?.teams.find((item: { teamTitle: string }) => item.teamTitle === teamName);

    if (team) {
      const teamOption = {
        value: team.uid,
        label: team.name,
        originalObject: team,
      };

      // Set the team value in the form
      setValue('team', teamOption, { shouldValidate: true, shouldDirty: true });

      // Trigger team selection analytics
      handleTeamSelect(teamOption);
    }
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

  const handleTeamSelect = (selectedTeam: { label: string; value: string; originalObject?: any } | null) => {
    const _team = member?.teams.find((team) => team.id === selectedTeam?.value);

    setValue('teamRole', _team?.role ?? '', { shouldValidate: true, shouldDirty: true });
    setValue('website', selectedTeam?.originalObject?.website ?? '', { shouldValidate: true, shouldDirty: true });
    setValue(
      'teamInvestInFundTypes',
      selectedTeam?.originalObject?.investorProfile?.investInFundTypes?.map((item: any) => ({
        label: item,
        value: item,
      })) || [],
    );
    setValue(
      'teamInvestInStartupStages',
      selectedTeam?.originalObject?.investorProfile?.investInStartupStages?.map((item: any) => ({
        label: item,
        value: item,
      })) || [],
    );
    setValue(
      'teamTypicalCheckSize',
      selectedTeam?.originalObject?.investorProfile?.typicalCheckSize
        ? formatNumberToCurrency(selectedTeam?.originalObject?.investorProfile?.typicalCheckSize)
        : '',
    );
    setValue('teamInvestmentFocusAreas', selectedTeam?.originalObject?.investorProfile?.investmentFocus || []);

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

  const onSubmit = async (initialFormData: TEditInvestorProfileForm) => {
    let formData = initialFormData;

    if (!memberData) {
      return;
    }

    // If the inline add-team form is open, create the team first, then continue with fresh values
    if (isAddingTeamInline && useInlineAddTeam) {
      const teamName = watch('newTeamName');
      const teamWebsite = watch('newTeamWebsite');
      const teamRole = watch('newTeamRole');
      let hasInlineErrors = false;
      if (!teamName) {
        setError('newTeamName', { type: 'manual', message: 'Team name is required' });
        hasInlineErrors = true;
      }
      if (!teamWebsite) {
        setError('newTeamWebsite', { type: 'manual', message: 'Website is required' });
        hasInlineErrors = true;
      }
      if (!teamRole) {
        setError('newTeamRole', { type: 'manual', message: 'Role is required' });
        hasInlineErrors = true;
      }
      const teamStartupStages = watch('teamInvestInStartupStages');
      if (!teamStartupStages || teamStartupStages.length === 0) {
        setError('teamInvestInStartupStages', { type: 'manual', message: 'Select at least one startup stage' });
        hasInlineErrors = true;
      }
      const teamCheckSize = watch('teamTypicalCheckSize');
      if (!teamCheckSize) {
        setError('teamTypicalCheckSize', { type: 'manual', message: 'Typical check size is required' });
        hasInlineErrors = true;
      }
      if (hasInlineErrors) return;
      pendingTeamDataRef.current = {
        name: teamName,
        website: teamWebsite,
        role: teamRole,
        startupStages: watch('teamInvestInStartupStages'),
        typicalCheckSize: watch('teamTypicalCheckSize'),
        investmentFocusAreas: watch('teamInvestmentFocusAreas'),
        fundTypes: watch('teamInvestInFundTypes'),
      };
      await saveTeamFn({
        name: teamName,
        website: teamWebsite || '',
        role: teamRole || '',
        requestorEmail: userInfo?.email,
        shortDescription: '',
      });
      // Use the created team uid directly from the API response
      formData = methods.getValues() as TEditInvestorProfileForm;
      if (createdTeamRef.current) {
        formData = {
          ...formData,
          team: {
            ...formData.team,
            value: createdTeamRef.current.uid,
            label: createdTeamRef.current.name,
          },
        };
        createdTeamRef.current = null;
      }
    }

    // Parse the currency string to get numeric value
    const typicalCheckSizeNumber = parseCurrencyToNumber(formData.typicalCheckSize ?? '');
    const teamTypicalCheckSizeNumber = parseCurrencyToNumber(formData.teamTypicalCheckSize ?? '');

    // Re-derive isTeamLead from fresh formData (the closure value may be stale after team creation)
    const currentIsTeamLead =
      member?.teams.find((team) => team.id === formData.team?.value)?.teamLead ||
      formData.team?.originalObject?.teamLead;

    try {
      if (formData.team) {
        const teamPayload: any = {
          role: formData.teamRole,
          investmentTeam: true,
          memberUid: member.id,
          ...(formData.website && { website: formData.website }),
        };

        if (currentIsTeamLead) {
          teamPayload.investorProfile = {
            investmentFocus: formData.teamInvestmentFocusAreas,
            investInStartupStages: formData.teamInvestInStartupStages.map((item) => item.value),
            investInFundTypes: formData.teamInvestInFundTypes.map((item) => item.value),
            typicalCheckSize: teamTypicalCheckSizeNumber,
          };
        }

        await updateTeamInvestorProfileMutation.mutateAsync({
          teamUid: formData.team.value,
          payload: teamPayload,
        });

        // const _existingTeam = member.teams.find((t) => t.id === formData?.team?.value);
        // const payload = {
        //   participantType: 'MEMBER',
        //   referenceUid: member.id,
        //   uniqueIdentifier: member.email,
        //   newData: formatPayload(
        //     memberData.memberInfo,
        //     { name: formData.team, role: formData.teamRole, url: '' },
        //     !_existingTeam,
        //     formData?.team?.value,
        //   ),
        // };
        //
        // await mutateAsync({
        //   uid: memberData.memberInfo.uid,
        //   payload,
        // });
      } else if (fundTeam) {
        await updateTeamInvestorProfileMutation.mutateAsync({
          teamUid: fundTeam?.id,
          payload: { investmentTeam: false, memberUid: member.id },
        });
      }

      const payload = {
        investorProfile: {
          type: deriveType(formData),
          investmentFocus: formData.investmentFocusAreas,
          typicalCheckSize: typicalCheckSizeNumber,
          investInStartupStages: formData.investInStartupStages.map((item) => item.label),
          secRulesAccepted: formData.secRulesAccepted,
          isInvestViaFund: formData.isInvestViaFund,
        },
      };

      await updateInvestorProfileMutation.mutateAsync({ memberUid: member.id, payload });

      if (userInfo?.email) {
        if (source === 'investor-drawer') {
          const drawerFormValues: Record<string, unknown> = {
            typicalCheckSize: typicalCheckSizeNumber,
            investInStartupStages: formData.investInStartupStages.map((item) => item.label),
            investmentFocus: formData.investmentFocusAreas,
            secRulesAccepted: formData.secRulesAccepted,
            isInvestViaFund: formData.isInvestViaFund,
          };
          if (formData.team && currentIsTeamLead) {
            drawerFormValues.teamTypicalCheckSize = teamTypicalCheckSizeNumber;
            drawerFormValues.teamInvestInStartupStages = formData.teamInvestInStartupStages.map((item) => item.value);
            drawerFormValues.teamInvestmentFocusAreas = formData.teamInvestmentFocusAreas;
            drawerFormValues.teamInvestInFundTypes = formData.teamInvestInFundTypes.map((item) => item.value);
          }
          onInvestorDrawerFormSaved({ from: 'investorProfile', values: drawerFormValues });
          reportAnalytics.mutate({
            name: DEMO_DAY_ANALYTICS.ON_INVESTOR_DRAWER_FORM_SAVED,
            distinctId: userInfo.email,
            properties: {
              from: 'investorProfile',
              values: drawerFormValues,
              userId: userInfo.uid,
              userEmail: userInfo.email,
              userName: userInfo.name,
            },
          });
        }

        onInvestorProfileUpdated({
          hasInvestmentFocus: formData.investmentFocusAreas?.length > 0,
          hasTypicalCheckSize: !!formData.typicalCheckSize,
          secRulesAccepted: formData.secRulesAccepted,
          isInvestViaFund: formData.isInvestViaFund,
          fieldsUpdated: Object.keys(formData).filter((key) => formData[key as keyof typeof formData] !== undefined),
        });

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
        <EditOfficeHoursFormControls onClose={onClose} title="Edit Investor Details" alwaysEnabled />
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
                    if (isSubmitted) trigger();
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
                      label="Startup stage(s) you invest in?"
                      placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A…)"
                      options={formOptions.fundingStageOptions}
                      isRequired
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
                      isRequired
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
                    if (isSubmitted) trigger();
                  }}
                >
                  <Checkbox.Indicator className={s.Indicator}>
                    <CheckIcon className={s.Icon} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <div className={s.col}>
                  <div className={s.primary}>I invest through fund(s).</div>
                </div>
              </label>

              {isInvestViaFund && (
                <>
                  {!isAddingTeamInline && (
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
                            onClick={() => setValue('team', null, { shouldValidate: true, shouldDirty: true })}
                            aria-label="Remove team"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
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
                              originalObject: item,
                            })) ?? []
                          }
                          renderOption={({ option, label, description }) => {
                            return (
                              <div className={s.teamOption}>
                                <ImageWithFallback
                                  width={24}
                                  height={24}
                                  alt={option.label}
                                  className={s.optImg}
                                  fallbackSrc="/icons/camera.svg"
                                  src={option.originalObject.logo}
                                />
                                <div>
                                  {label}
                                  {description}
                                </div>
                              </div>
                            );
                          }}
                          onChange={(value) => handleTeamSelect(value)}
                          isStickyNoData
                          selectRef={teamSelectRef}
                          notFoundContent={
                            <div className={s.secondaryLabel}>
                              If you don&apos;t see your team on this list, please{' '}
                              <button
                                type="button"
                                className={s.link}
                                onClick={() => {
                                  handleAddTeamLinkClick();
                                  // Close the dropdown menu
                                  (teamSelectRef.current as any)?.blur();
                                  if (useInlineAddTeam) {
                                    setIsAddingTeamInline(true);
                                  } else {
                                    setIsAddTeamDrawerOpen(true);
                                  }
                                }}
                              >
                                add your team
                              </button>{' '}
                              first.
                            </div>
                          }
                        />
                      </div>
                    </>
                  )}

                  {isAddingTeamInline && useInlineAddTeam && (
                    <AddTeamInlineForm
                      showInvestorFields
                      investorFieldsConfig={{
                        fundingStageOptions: formOptions.fundingStageOptions,
                        fundTypeOptions: formOptions.fundTypeOptions,
                      }}
                      fieldNames={{
                        role: 'newTeamRole',
                        name: 'newTeamName',
                        website: 'newTeamWebsite',
                        startupStages: 'teamInvestInStartupStages',
                        typicalCheckSize: 'teamTypicalCheckSize',
                        investmentFocusAreas: 'teamInvestmentFocusAreas',
                        fundTypes: 'teamInvestInFundTypes',
                      }}
                      onClose={() => setIsAddingTeamInline(false)}
                    />
                  )}

                  {selectedTeam && !isAddingTeamInline && (
                    <>
                      <div className={s.row}>
                        <FormField
                          name="teamRole"
                          placeholder="Enter your role"
                          label="Role"
                          disabled={!selectedTeam}
                          isRequired={!!isTeamLead}
                        />
                        {!isTeamLead && !useInlineAddTeam && (
                          <div className={s.infoSection}>
                            <div className={s.infoIcon}>
                              <InfoIcon />
                            </div>
                            <div className={s.infoContent}>
                              <p className={s.infoText}>
                                Update to fund&apos;s investment details can only be made by team lead
                              </p>
                            </div>
                          </div>
                        )}
                        {!isTeamLead && useInlineAddTeam && (
                          <div className={s.noAccessInfoBox}>
                            <div className={s.noAccessIcon}>
                              <InfoIconFilled />
                            </div>
                            <div className={s.noAccessContent}>
                              <p className={s.noAccessTitle}>You don&apos;t have access to edit team information</p>
                              <p className={s.noAccessDescription}>
                                Only team leads can update investment details for {selectedTeam?.label}.
                              </p>
                              <div className={s.noAccessActions}>
                                <button
                                  type="button"
                                  className={s.contactSupportLink}
                                  onClick={() => {
                                    const teamRole = watch('teamRole');
                                    const message = `Fund: ${selectedTeam?.label || 'N/A'}\nMy Role: ${teamRole || 'N/A'}\nReason:`;
                                    openContactSupport(undefined, 'contactSupport', message);
                                  }}
                                >
                                  Contact Support
                                  <ExternalLinkIconBlue />
                                </button>
                                <span className={s.noAccessActionText}>to request lead reassignment.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {isTeamLead && (
                        <>
                          <div className={s.row}>
                            <FormField
                              name="website"
                              placeholder="Enter website"
                              label="Website address"
                              description="Paste a URL (company website, LinkedIn, Notion, X.com, Bluesky, etc.)"
                              disabled={!isTeamLead || !selectedTeam}
                              isRequired
                              onBlur={() => ensureProtocol()}
                            />
                          </div>

                          <div className={s.row}>
                            <FormMultiSelect
                              name="teamInvestInStartupStages"
                              label="Startup stage(s) you invest in?"
                              placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A…)"
                              options={formOptions.fundingStageOptions}
                              disabled={!isTeamLead || !selectedTeam}
                              isRequired
                            />
                          </div>

                          <div className={s.row}>
                            <FormCurrencyField
                              name="teamTypicalCheckSize"
                              label="Typical Check Size"
                              placeholder="Select typical check size (E.g. $25k - $50.000k)"
                              currency="USD"
                              disabled={!isTeamLead || !selectedTeam}
                              isRequired
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

                          <div className={s.row}>
                            <FormMultiSelect
                              name="teamInvestInFundTypes"
                              label="Type of fund(s) you invest in?"
                              placeholder="Select fund types (e.g., Early stage, Late stage, Fund-of-funds)"
                              options={formOptions.fundTypeOptions}
                              disabled={!isTeamLead || !selectedTeam}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
          </div>

          {secRulesAccepted && source !== 'investor-drawer' && (
            <div className={clsx(s.block, s.ctaBlock)}>
              <Link href="/settings/email" target="_blank" className={s.cta}>
                <div className={s.ctaIcon}>
                  <InfoIcon />
                </div>
                <div className={s.col}>
                  <div className={s.ctaLink}>Manage your investor settings</div>
                  <p>Update demo day invites and investor profile visibility in Account Settings → </p>
                  <p className={s.link}>
                    Email Preferences <LinkIcon />
                  </p>
                </div>
              </Link>
            </div>
          )}
        </div>
        <EditOfficeHoursMobileControls alwaysEnabled />
      </form>

      {!useInlineAddTeam && (
        <AddTeamDrawer
          isOpen={isAddTeamDrawerOpen}
          onClose={() => setIsAddTeamDrawerOpen(false)}
          userInfo={userInfo}
          onSuccess={handleTeamCreated}
        />
      )}
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
