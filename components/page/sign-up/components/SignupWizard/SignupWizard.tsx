'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import Image from 'next/image';
import Cookies from 'js-cookie';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';

import Illustration from '@/components/page/onboarding/components/Illustartion/Illustration';
import { yupResolver } from '@hookform/resolvers/yup';
import { saveRegistrationImage } from '@/services/registration.service';
import { SignupForm } from '@/components/page/sign-up/components/SignupWizard/types';
import { signupSchema } from '@/components/page/sign-up/components/SignupWizard/helpers';
import { FormField } from '@/components/form/FormField';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { ProfileImageInput } from '@/components/page/sign-up/components/ProfileImageInput';
import { getRecaptchaToken } from '@/services/google-recaptcha.service';
import { toast } from '@/components/core/ToastContainer';
import { isSkipRecaptcha } from '@/utils/common.utils';
import { useSignUpAnalytics } from '@/analytics/sign-up.analytics';
import { useSignupV2 } from '@/services/signup/hooks/useSignup';
import { Checkbox } from '@/components/common/Checkbox';
import { MAX_NAME_LENGTH } from '@/constants/profile';

import { PRIVACY_URL, TERMS_OF_SERVICE_AND_PRIVACY_URL, TERMS_OF_SERVICE_URL } from './constants';

import s from './SignupWizard.module.scss';
import { FormSelect } from '@/components/form/FormSelect';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { useMemberAnalytics } from '@/analytics/members.analytics';

interface Props {
  onClose?: () => void;
  signUpSource?: string;
}

export const SignupWizard = ({ onClose, signUpSource }: Props) => {
  const router = useRouter();
  const { data } = useMemberFormOptions();
  const searchParams = useSearchParams();
  const analytics = useSignUpAnalytics();
  const memberAnalytics = useMemberAnalytics();
  const [isAddingTeam, setIsAddingTeam] = useState(false);

  const methods = useForm<SignupForm>({
    defaultValues: {
      name: '',
      email: '',
      image: null,
      teamOrProject: null,
      teamName: '',
      websiteAddress: '',
      about: '',
      subscribe: true,
      agreed: true,
    },
    mode: 'all',
    context: { isAddingTeam },
    // @ts-ignore
    resolver: yupResolver(signupSchema),
  });
  const {
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { isSubmitting, isValid, submitCount },
  } = methods;
  const { subscribe, agreed } = watch();

  const { mutateAsync } = useSignupV2();

  // Get returnTo parameter from URL
  const returnTo = searchParams.get('returnTo');

  const onSubmit = async (formData: SignupForm) => {
    const reCAPTCHAToken = await getRecaptchaToken();

    // Validating reCAPTCHAToken
    if ((reCAPTCHAToken.error || !reCAPTCHAToken.token) && !isSkipRecaptcha()) {
      toast.error('Google reCAPTCHA validation failed. Please try again.');
      analytics.recordSignUpSave('submit-clicked-captcha-failed', formData);
      return;
    }

    analytics.recordSignUpSave('submit-clicked', formData);

    const campaign = Cookies.get('utm_campaign') ?? '';
    const source = Cookies.get('utm_source') || searchParams.get('utm_source') || '';
    const medium = Cookies.get('utm_medium') ?? '';

    let image;

    if (formData.image) {
      const imgResponse = await saveRegistrationImage(formData.image);
      image = imgResponse?.image;
    }

    // Build the newData object
    const newData: Record<string, any> = {
      name: formData.name,
      email: formData.email,
      isSubscribedToNewsletter: formData.subscribe,
      isUserConsent: formData.agreed,
    };

    if (image) {
      newData.imageUid = image.uid;
      newData.imageUrl = image.url;
    }

    if (formData.about?.trim()) {
      newData.aboutYou = formData.about.trim();
    }

    // Build the team/project object
    let team: { uid?: string; name?: string; website?: string } = {};
    let isTeamNew = false;
    let project: { projectUid: string } | null = null;

    if (formData.teamOrProject) {
      isTeamNew = false;

      // Check if it's a team or project
      if (formData.teamOrProject.type === 'project') {
        // For projects, we'll use projectContributions
        project = {
          projectUid: formData.teamOrProject.value,
        };
      } else {
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

    // Build the payload for useSignupV2
    const payload: any = {
      uniqueIdentifier: formData.email,
      role: formData.role || '',
      isTeamNew,
      ...(project ? { project } : formData.teamName || (team && Object.keys(team).length > 0) ? { team } : {}),
      newData,
    };

    // Use signUpSource prop if provided, otherwise fall back to UTM source
    if (signUpSource) {
      payload.signUpSource = signUpSource;
    } else if (source) {
      payload.signUpSource = source;
    }
    if (medium) {
      payload.signUpMedium = medium;
    }
    if (campaign) {
      payload.signUpCampaign = campaign;
    }

    const res = await mutateAsync(payload);

    if (res.success) {
      analytics.recordSignUpSave('submit-clicked-success', formData);

      router.replace(
        `${window.location.origin}/members/${res.data.uid}?prefillEmail=${encodeURIComponent(formData.email)}&returnTo=members-${res.data.uid}#login`,
      );

      setTimeout(() => {
        if (onClose) {
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
  };

  return (
    <>
      <div className={s.modal}>
        <div className={s.modalContent}>
          <button
            type="button"
            className={s.closeButton}
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                // Navigate back to the returnTo URL or home page
                router.replace(returnTo || '/');
              }
            }}
          >
            <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
          </button>
          <div className={s.illustration}>
            <Illustration />
          </div>
          <FormProvider {...methods}>
            {/* @ts-ignore */}
            <form className={clsx(s.root)} noValidate onSubmit={handleSubmit(onSubmit)}>
              <div className={s.content}>
                <div className={s.title}>Join the PL Network</div>
                <div className={s.row}>
                  <ProfileImageInput />
                  <FormField name="name" label="Name" isRequired placeholder="Enter your name" max={MAX_NAME_LENGTH} />
                </div>
                <div className={s.row}>
                  <FormField name="email" label="Email" isRequired placeholder="Enter your email" />
                </div>

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
                                  memberAnalytics.onAddTeamDropdownClicked('signup');
                                  setIsAddingTeam(true);
                                  setValue('teamOrProject', null, { shouldValidate: true });
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
                  <div className={s.row}>
                    <FormField
                      name="websiteAddress"
                      placeholder="Enter website address"
                      label="Website address"
                      isRequired
                    />
                  </div>
                )}

                {/*<div className={s.row}>*/}
                {/*  <Field.Root className={s.field}>*/}
                {/*    <Field.Label className={s.label}>Select a Team or a Project you are associated with</Field.Label>*/}
                {/*    <SearchWithSuggestions*/}
                {/*      addNew={{*/}
                {/*        enable: true,*/}
                {/*        title: 'Not able to find your project or team?',*/}
                {/*        actionString: 'Share URL',*/}
                {/*        iconURL: '/icons/sign-up/share.svg',*/}
                {/*        placeHolderText: 'Enter or paste URL here',*/}
                {/*      }}*/}
                {/*      id={'search-team-and-project'}*/}
                {/*      name={'search-team-and-project'}*/}
                {/*      placeHolder="Enter a name of your team or project"*/}
                {/*      onSelect={(suggestion) => {*/}
                {/*        setValue('teamOrProject', suggestion, { shouldValidate: true });*/}
                {/*      }}*/}
                {/*    />*/}
                {/*  </Field.Root>*/}
                {/*</div>*/}

                <div className={s.row}>
                  <div className={s.aboutField}>
                    <div className={s.aboutLabel}>
                      <span className={s.aboutLabelText}>Tell us a bit about you</span>
                      <span className={s.aboutLabelOptional}>(Optional)</span>
                    </div>
                    <FormTextArea
                      name="about"
                      placeholder="Founder at Foresight Ventures, supporting early-stage teams in AI, biotech, and frontier tech."
                      rows={3}
                      maxLength={400}
                      showCharCount={true}
                    />
                  </div>
                </div>

                <div className={s.col}>
                  <label className={s.Label}>
                    <Checkbox
                      checked={subscribe}
                      onChange={(v) => setValue('subscribe', v, { shouldValidate: true })}
                    />
                    <div className={s.primary}>Subscribe to PL Newsletter</div>
                  </label>
                  <label className={s.Label}>
                    <Checkbox
                      checked={agreed}
                      onChange={(v) => setValue('agreed', v as true, { shouldValidate: true })}
                    />
                    <div className={s.primary}>
                      I agree to Protocol Labs{' '}
                      <a href={TERMS_OF_SERVICE_URL} target="_blank">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href={PRIVACY_URL} target="_blank">
                        Privacy Policy
                      </a>
                    </div>
                  </label>
                </div>

                <p className={s.hint}>
                  You also allow Protocol Labs and companies within the network to contact you for events and
                  opportunities within the network. Your information may only be shared with verified network members
                  and will not be available to any individuals or entities outside the network.
                </p>

                <button type="submit" className={s.actionButton} disabled={isSubmitting || !agreed || !isValid}>
                  {isSubmitting ? (
                    <>
                      <div className={s.loader} /> <span>Creating profile</span>
                    </>
                  ) : (
                    <>Create profile</>
                  )}
                </button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.GOOGLE_SITE_KEY}`}
        strategy="lazyOnload"
      ></Script>
    </>
  );
};
