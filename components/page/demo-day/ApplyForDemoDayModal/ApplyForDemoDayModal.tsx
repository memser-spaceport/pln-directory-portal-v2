'use client';

import React, { useState, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { Modal } from '@/components/common/Modal';
import { FormField } from '@/components/form/FormField';
import { Button } from '@/components/common/Button';
import { useApplyForDemoDay, ApplyForDemoDayPayload } from '@/services/demo-day/hooks/useApplyForDemoDay';
import { IUserInfo } from '@/types/shared.types';
import { IMember, IMemberTeam } from '@/types/members.types';

import s from './ApplyForDemoDayModal.module.scss';
import { FormSelect } from '@/components/form/FormSelect';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { CheckIcon } from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/icons';
import { DemoDayState } from '@/app/actions/demo-day.actions';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { ITeam } from '@/types/teams.types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { getMember } from '@/services/members.service';
import { isValid } from 'zod';
import { toast } from '@/components/core/ToastContainer';
import { useRouter } from 'next/navigation';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

const applySchema = yup.object().shape(
  {
    name: yup.string().required('Name is required'),
    email: yup.string().email('Must be a valid email').required('Email is required'),
    linkedin: yup.string().defined(),
    teamOrProject: yup.mixed<string | Record<string, string>>().when('teamName', {
      is: (teamName: string) => !teamName,
      then: (schema) => schema.defined().nullable(),
      otherwise: (schema) => schema.nullable(),
    }),
    teamName: yup.string().when('teamOrProject', {
      is: (teamOrProject: any) => !teamOrProject,
      then: (schema) => schema.nullable(),
      otherwise: (schema) => schema.nullable(),
    }),
    websiteAddress: yup.string().when('teamName', {
      is: (teamName: string) => Boolean(teamName),
      then: (schema) => schema.required('Website address is required when adding a new team'),
      otherwise: (schema) => schema.nullable(),
    }),
    role: yup.string().defined(),
    isInvestor: yup
      .boolean()
      .oneOf([true], 'You must confirm that you are an accredited investor')
      .required('You must confirm that you are an accredited investor'),
  },
  [
    ['teamOrProject', 'teamName'],
    ['teamName', 'websiteAddress'],
  ],
);

type ApplyFormData = yup.InferType<typeof applySchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userInfo?: IUserInfo | null;
  memberData?: IMember | null;
  demoDaySlug: string;
  demoDayData?: DemoDayState | null;
  onSuccessUnauthenticated?: () => void;
}

const PencilIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0 26C0 11.6406 11.6406 0 26 0C40.3594 0 52 11.6406 52 26C52 40.3594 40.3594 52 26 52C11.6406 52 0 40.3594 0 26Z"
      fill="#F2F5FF"
    />
    <path
      d="M38.415 19.1714L32.8288 13.5864C32.643 13.4007 32.4225 13.2533 32.1799 13.1528C31.9372 13.0522 31.6771 13.0005 31.4144 13.0005C31.1517 13.0005 30.8916 13.0522 30.6489 13.1528C30.4062 13.2533 30.1857 13.4007 30 13.5864L14.5863 29.0002C14.3997 29.1852 14.2519 29.4055 14.1512 29.6482C14.0506 29.8909 13.9992 30.1512 14 30.4139V36.0002C14 36.5306 14.2107 37.0393 14.5858 37.4144C14.9609 37.7895 15.4696 38.0002 16 38.0002H37C37.2652 38.0002 37.5196 37.8948 37.7071 37.7073C37.8947 37.5198 38 37.2654 38 37.0002C38 36.735 37.8947 36.4806 37.7071 36.2931C37.5196 36.1055 37.2652 36.0002 37 36.0002H24.415L38.415 22.0002C38.6008 21.8145 38.7481 21.594 38.8487 21.3513C38.9492 21.1086 39.001 20.8485 39.001 20.5858C39.001 20.3231 38.9492 20.063 38.8487 19.8203C38.7481 19.5777 38.6008 19.3572 38.415 19.1714ZM34 23.5864L28.415 18.0002L31.415 15.0002L37 20.5864L34 23.5864Z"
      fill="#1B4DFF"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.0833 2.33331H2.91667C2.27233 2.33331 1.75 2.85565 1.75 3.49998V11.6666C1.75 12.311 2.27233 12.8333 2.91667 12.8333H11.0833C11.7277 12.8333 12.25 12.311 12.25 11.6666V3.49998C12.25 2.85565 11.7277 2.33331 11.0833 2.33331Z"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.33331 1.16669V3.50002"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.66669 1.16669V3.50002"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.75 5.83331H12.25"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ApplyForDemoDayModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userInfo,
  memberData,
  demoDaySlug,
  demoDayData,
  onSuccessUnauthenticated,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useApplyForDemoDay(demoDaySlug);
  const { data } = useMemberFormOptions();
  const memberAnalytics = useMemberAnalytics();
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [minLoaderTime, setMinLoaderTime] = useState<number | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  // Check if user is authenticated
  const authToken = Cookies.get('authToken');
  const isAuthenticated = Boolean(authToken);

  const {
    data: member,
    isLoading: isMemberLoading,
    isFetching: isMemberFetching,
  } = useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, userInfo?.uid, !!userInfo, userInfo?.uid],
    queryFn: () =>
      getMember(
        userInfo?.uid ?? '',
        { with: 'image,skills,location,teamMemberRoles.team' },
        !!userInfo,
        userInfo,
        true,
        true,
      ),
    enabled: !!userInfo?.uid && isOpen,
    select: (data) => data?.data?.formattedData,
  });

  // Track when loading starts to ensure minimum 3 second loader display
  useEffect(() => {
    if ((isMemberLoading || isMemberFetching) && minLoaderTime === null) {
      setMinLoaderTime(Date.now());
      setShowLoader(true);
    }
  }, [isMemberLoading, isMemberFetching, minLoaderTime]);

  // Hide loader only after minimum 3 seconds have passed (but not if auto-submitting)
  useEffect(() => {
    if (!isMemberLoading && !isMemberFetching && minLoaderTime !== null && showLoader && !isAutoSubmitting) {
      const elapsedTime = Date.now() - minLoaderTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);

      if (remainingTime > 0) {
        const timer = setTimeout(() => {
          setShowLoader(false);
        }, remainingTime);
        return () => clearTimeout(timer);
      } else {
        setShowLoader(false);
      }
    }
  }, [isMemberLoading, isMemberFetching, minLoaderTime, showLoader, isAutoSubmitting]);

  let mainTeam: IMemberTeam | ITeam | null = member?.mainTeam;
  mainTeam = !mainTeam && memberData?.teams?.length === 1 ? memberData.teams[0] : mainTeam;

  const methods = useForm<ApplyFormData>({
    defaultValues: {
      email: memberData?.email || userInfo?.email || '',
      name: memberData?.name || userInfo?.name || '',
      linkedin: memberData?.linkedinHandle || '',
      // @ts-ignore
      teamOrProject: mainTeam ? { value: mainTeam.id, label: mainTeam.name, type: 'team' } : '',
      teamName: '',
      websiteAddress: '',
      role: member?.role ?? mainTeam?.role ?? '',
      isInvestor: false,
    },
    context: { isAddingTeam },
    // @ts-ignore
    resolver: yupResolver(applySchema),
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = methods;

  const isInvestor = watch('isInvestor');

  // Reinitialize form when member data is fetched
  useEffect(() => {
    if (member) {
      reset({
        email: member.email || userInfo?.email || '',
        name: member.name || userInfo?.name || '',
        linkedin: member.linkedinHandle || '',
        // @ts-ignore
        teamOrProject: mainTeam ? { value: mainTeam.id, label: mainTeam.name, type: 'team' } : null,
        teamName: '',
        websiteAddress: '',
        role: member.role ?? mainTeam?.role ?? '',
        isInvestor: member.investorProfile?.secRulesAccepted ?? false,
      });
    }
  }, [member, mainTeam, userInfo, reset]);

  // Auto-submit if all required fields are available
  useEffect(() => {
    const autoSubmit = async () => {
      if (
        !hasAutoSubmitted &&
        member &&
        !isMemberLoading &&
        !isMemberFetching &&
        member.email &&
        member.name &&
        member.investorProfile?.secRulesAccepted &&
        isOpen &&
        minLoaderTime !== null
      ) {
        setHasAutoSubmitted(true);
        setIsAutoSubmitting(true);  // ✅ Mark as auto-submitting to keep loader visible

        // Calculate remaining time to show loader for at least 3 seconds
        const elapsedTime = Date.now() - minLoaderTime;
        const remainingTime = Math.max(0, 3000 - elapsedTime);

        // Wait for minimum loader time
        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        // Build the payload
        let team: { uid?: string; name?: string; website?: string } = {};
        let isTeamNew = false;
        let project: { projectUid: string } | null = null;

        if (mainTeam) {
          team = {
            uid: mainTeam.id,
          };
        }

        const payload: ApplyForDemoDayPayload = {
          name: member.name,
          email: member.email,
          linkedin: member.linkedinHandle || '',
          role: member.role ?? mainTeam?.role ?? '',
          isInvestor: true,
          isTeamNew,
          ...(team && Object.keys(team).length > 0 ? { team } : {}),
        };

        try {
          await mutateAsync(payload);

          // Invalidate demo day state queries
          await queryClient.invalidateQueries({
            queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATE],
          });

          reset();
          setIsAddingTeam(false);
          setMinLoaderTime(null);
          setIsAutoSubmitting(false);  // ✅ Reset auto-submitting state
          onClose();

          // Trigger success modal for non-authenticated users
          if (!isAuthenticated && onSuccessUnauthenticated) {
            onSuccessUnauthenticated();
          }
        } catch (error) {
          console.error('Auto-submit failed:', error);
          // Reset flags on error so user can try again
          setHasAutoSubmitted(false);
          setMinLoaderTime(null);
          setIsAutoSubmitting(false);  // ✅ Reset auto-submitting state on error
        }
      }
    };

    autoSubmit();
  }, [
    hasAutoSubmitted,
    member,
    mainTeam,
    isMemberLoading,
    isMemberFetching,
    mutateAsync,
    queryClient,
    reset,
    onClose,
    isAuthenticated,
    onSuccessUnauthenticated,
    isOpen,
    minLoaderTime,
  ]);

  const onSubmit = async (formData: ApplyFormData) => {
    try {
      // Build the team/project object
      let team: { uid?: string; name?: string; website?: string } = {};
      let isTeamNew = false;
      let project: { projectUid: string } | null = null;

      if (formData.teamOrProject) {
        isTeamNew = false;

        // Check if it's a team or project
        if (typeof formData.teamOrProject === 'object' && formData.teamOrProject.type === 'project') {
          // For projects, we'll use projectContributions
          project = {
            projectUid: formData.teamOrProject.value,
          };
        } else if (typeof formData.teamOrProject === 'object') {
          // For teams, use the team object
          team = {
            uid: formData.teamOrProject.value,
          };
        }
      } else if (formData.teamName) {
        isTeamNew = true;
        team = {
          name: formData.teamName,
          ...(formData.websiteAddress && { website: formData.websiteAddress }),
        };
      }

      // Build the payload
      const payload: ApplyForDemoDayPayload = {
        name: formData.name,
        email: formData.email,
        linkedin: formData.linkedin,
        role: formData.role,
        isInvestor: formData.isInvestor,
        isTeamNew,
        ...(project ? { project } : formData.teamName || (team && Object.keys(team).length > 0) ? { team } : {}),
      };

      const res = await mutateAsync(payload);

      if (res) {
        // Invalidate demo day state queries
        await queryClient.invalidateQueries({
          queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATE],
        });

        // Trigger success modal for non-authenticated users
        if (!isAuthenticated && onSuccessUnauthenticated) {
          router.replace(`${window.location.pathname}?prefillEmail=${encodeURIComponent(formData.email)}#login`);
        }

        setTimeout(() => {
          if (onClose) {
            reset();
            setIsAddingTeam(false);
            setMinLoaderTime(null);
            onClose();
          }
        }, 700);
      } else {
        if (res?.message) {
          toast.error(res?.message);
        } else {
          toast.error('Something went wrong. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
    }
  };

  const handleClose = () => {
    reset();
    setIsAddingTeam(false);
    setHasAutoSubmitted(false);
    setMinLoaderTime(null);
    setShowLoader(false);
    setIsAutoSubmitting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} overlayClassname={s.overlay}>
      <div className={s.modal}>
        <button type="button" className={s.closeButton} onClick={handleClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className={s.content}>
          <div className={s.icon}>
            <PencilIcon />
          </div>

          <div className={s.text}>
            <h2 className={s.title}>Application for {demoDayData?.title || 'PL Demo Day'}</h2>

            {demoDayData?.date && (
              <div className={s.dateInfo}>
                <div className={s.dateLabel}>
                  <CalendarIcon />
                  <span>Date & Time:</span>
                </div>
                <span className={s.dateValue}>{format(new Date(demoDayData.date), 'dd MMMM, yyyy, h:mm a')}</span>
              </div>
            )}

            {demoDayData?.description && (
              <p className={s.description} dangerouslySetInnerHTML={{ __html: demoDayData.description }} />
            )}
          </div>

          {showLoader || isAutoSubmitting ? (
            <div className={s.loaderContainer}>
              <div className={s.loader} />
              <p className={s.loaderText}>
                {isAutoSubmitting ? 'Submitting your application...' : 'Loading your information...'}
              </p>
            </div>
          ) : (
            <FormProvider {...methods}>
            {/* @ts-ignore */}
            <form className={s.form} noValidate onSubmit={handleSubmit(onSubmit)}>
              <FormField
                name="email"
                label="Email Address"
                placeholder="Enter your email"
                isRequired
                disabled={isAuthenticated}
              />

              <FormField
                name="name"
                label="Full Name"
                placeholder="Enter your full name"
                isRequired
                disabled={isAuthenticated}
              />

              <FormField name="linkedin" label="LinkedIn profile" placeholder="Enter link to your LinkedIn profile" />

              <div className={s.column}>
                <div className={s.inputsLabel}>Add Role & Team</div>
                {!isAddingTeam ? (
                  <>
                    <div className={s.inputsWrapper}>
                      <FormField name="role" placeholder="Enter your primary role" />
                      <span>@</span>
                      <FormSelect
                        name="teamOrProject"
                        placeholder="Search or add a team"
                        backLabel="Teams & Projects"
                        options={[
                          ...(data?.teams?.map((item: { teamUid: string; teamTitle: string; logo?: string }) => ({
                            value: item.teamUid,
                            label: item.teamTitle,
                            type: 'team' as const,
                            originalObject: item,
                          })) ?? []),
                          ...(data?.projects?.map(
                            (item: { projectUid: string; projectName: string; projectLogo?: string }) => ({
                              value: item.projectUid,
                              label: item.projectName,
                              type: 'project' as const,
                              originalObject: item,
                            }),
                          ) ?? []),
                        ].sort((a, b) => a.label.localeCompare(b.label))}
                        renderOption={({ option, label, description }) => {
                          return (
                            <div className={s.teamOption}>
                              <ImageWithFallback
                                width={24}
                                height={24}
                                alt={option.label}
                                className={s.optImg}
                                fallbackSrc="/icons/camera.svg"
                                src={option.originalObject.logo || option.originalObject.projectLogo}
                              />
                              <div className={s.optionContent}>
                                {label}
                                {description}
                              </div>
                              <span className={s.badge} data-type={option.type}>
                                {option.type === 'team' ? 'Team' : 'Project'}
                              </span>
                            </div>
                          );
                        }}
                        isStickyNoData
                        notFoundContent={
                          <div className={s.secondaryLabel}>
                            Not able to find your project or team?
                            <br />
                            <button
                              type="button"
                              className={s.link}
                              onClick={() => {
                                setIsAddingTeam(true);
                                setValue('teamOrProject', undefined, { shouldValidate: true });
                              }}
                            >
                              Add your team
                            </button>
                          </div>
                        }
                      />
                    </div>
                  </>
                ) : (
                  <div className={s.col}>
                    <div className={s.column}>
                      <div className={s.inputsWrapper}>
                        <FormField name="role" placeholder="Enter your primary role" />
                        <span>@</span>
                        <FormField
                          name="teamName"
                          placeholder="Enter team name"
                          clearable
                          onClear={() => {
                            setIsAddingTeam(false);
                            setValue('teamName', '', { shouldValidate: true });
                            setValue('websiteAddress', '', { shouldValidate: true });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {isAddingTeam && (
                <FormField
                  name="websiteAddress"
                  placeholder="Enter website address"
                  label="Website address"
                  isRequired
                />
              )}

              <label className={s.Label}>
                <Checkbox.Root
                  className={s.Checkbox}
                  checked={isInvestor}
                  onCheckedChange={(v: boolean) => {
                    setValue('isInvestor', v, { shouldValidate: true, shouldDirty: true });
                  }}
                >
                  <Checkbox.Indicator className={s.Indicator}>
                    <CheckIcon className={s.Icon} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <div className={s.col}>
                  <div className={s.primary}>
                    I am an “accredited investor” under Rule 501(a) of the Securities Act of 1933, or I represent a
                    VC/fund or institutional investor.
                  </div>
                  <div className={s.secondary}>
                    I understand that Polaris does not endorse or recommend any investments, and is not a broker,
                    dealer, or advisor. I agree that I am solely responsible for my own compliance with securities laws
                    and for conducting my own due diligence.
                  </div>
                  {errors.isInvestor && <div className={s.errorMessage}>{errors.isInvestor.message}</div>}
                </div>
              </label>

              <div className={s.bottomText}>
                <p className={s.body}>
                  The information you provide will help us confirm your investor profile and ensure the event remains
                  relevant and valuable for both founders and participant teams.
                </p>
                <p className={s.bodySecondary}>
                  By submitting this form, you agree to our{' '}
                  <a href="https://drive.google.com/file/d/1RIAyMlyuLYnipa6W_YBzcJ6hDzfH7yW3/view" target="_blank">
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a href="https://drive.google.com/file/d/1MjOF66asddB_hsg7Jc-7Oxk6L1EvYHxk/view" target="_blank">
                    Terms & Conditions
                  </a>
                  .
                </p>
              </div>

              <div className={s.footer}>
                <Button type="button" size="m" variant="secondary" style="border" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" size="m" style="fill" variant="primary" disabled={isPending || !isValid}>
                  {isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </FormProvider>
          )}
        </div>
      </div>
    </Modal>
  );
};
