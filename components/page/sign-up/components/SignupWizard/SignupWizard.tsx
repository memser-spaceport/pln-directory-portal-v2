'use client';

import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import Image from 'next/image';
import Illustration from '@/components/page/onboarding/components/Illustartion/Illustration';
import { yupResolver } from '@hookform/resolvers/yup';
import { clsx } from 'clsx';
import { saveRegistrationImage } from '@/services/registration.service';
import { SignupForm } from '@/components/page/sign-up/components/SignupWizard/types';
import { signupSchema } from '@/components/page/sign-up/components/SignupWizard/helpers';
import { FormField } from '@/components/form/FormField';
import { ProfileImageInput } from '@/components/page/sign-up/components/ProfileImageInput';
import { Field } from '@base-ui-components/react/field';
import { Checkbox } from '@base-ui-components/react/checkbox';
import Script from 'next/script';
import { getRecaptchaToken } from '@/services/google-recaptcha.service';
import { toast } from 'react-toastify';
import { isSkipRecaptcha } from '@/utils/common.utils';
import { useSignUpAnalytics } from '@/analytics/sign-up.analytics';
import Cookies from 'js-cookie';
import SearchWithSuggestions from '@/components/form/suggestions';
import s from './SignupWizard.module.scss';
import { useSignup } from '@/services/signup/hooks/useSignup';
import { GROUP_TYPES } from '@/utils/constants';
import { useRouter } from 'next/navigation';

interface Props {
  onClose: () => void;
}

export const SignupWizard = ({ onClose }: Props) => {
  const router = useRouter();
  const analytics = useSignUpAnalytics();
  const methods = useForm<SignupForm>({
    defaultValues: {
      name: '',
      email: '',
      image: null,
      teamOrProject: '',
      subscribe: true,
      agreed: true,
    },
    mode: 'all',
    resolver: yupResolver(signupSchema),
  });
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, isValid, submitCount },
  } = methods;
  const { subscribe, agreed } = watch();

  const { mutateAsync } = useSignup();

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
    const source = Cookies.get('utm_source') ?? '';
    const medium = Cookies.get('utm_medium') ?? '';

    const payload: Record<string, any> = {
      name: formData.name,
      email: formData.email,
      isSubscribedToNewsletter: formData.subscribe,
      isUserConsent: formData.agreed,
    };

    let image;

    if (formData.image) {
      const imgResponse = await saveRegistrationImage(formData.image);
      image = imgResponse?.image;
    }

    if (image) {
      payload.imageUid = image.uid;
      payload.imageUrl = image.url;
    }

    if (typeof formData.teamOrProject === 'string') {
      payload.teamOrProjectURL = formData.teamOrProject;
    } else if (formData.teamOrProject.group === GROUP_TYPES.PROJECT) {
      payload.projectContributions = [{ projectUid: formData.teamOrProject.uid }];
    } else if (formData.teamOrProject.group === GROUP_TYPES.TEAM) {
      payload.teamAndRoles = [{ teamUid: formData.teamOrProject.uid, teamTitle: formData.teamOrProject.name }];
    }

    if (source) {
      payload.signUpSource = source;
    }
    if (medium) {
      payload.signUpMedium = medium;
    }
    if (campaign) {
      payload.signUpCampaign = campaign;
    }

    const res = await mutateAsync({
      payload,
      reCAPTCHAToken: reCAPTCHAToken.token,
    });

    if (res.success) {
      analytics.recordSignUpSave('submit-clicked-success', formData);
      // toast.success('Thank you for signing up! Your profile is currently under review. You’ll receive an email as soon as it’s approved.');

      // todo - use case C
      router.replace(`${window.location.origin}/members/${res.data.uid}?prefillEmail=${encodeURIComponent(payload.email)}&returnTo=members-${res.data.uid}#login`);

      setTimeout(() => {
        onClose();
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
              onClose();
            }}
          >
            <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
          </button>
          <div className={s.illustration}>
            <Illustration />
          </div>
          <FormProvider {...methods}>
            <form className={clsx(s.root)} noValidate onSubmit={handleSubmit(onSubmit)}>
              <div className={s.content}>
                <div className={s.title}>Join the PL Network</div>
                <div className={s.row}>
                  <ProfileImageInput />
                  <FormField name="name" label="Name*" placeholder="Enter name" />
                </div>
                <div className={s.row}>
                  <FormField name="email" label="Email*" placeholder="Enter email" />
                </div>
                <div className={s.row}>
                  <Field.Root className={s.field}>
                    <Field.Label className={s.label}>Select a Team or a Project you are associated with</Field.Label>
                    <SearchWithSuggestions
                      addNew={{
                        enable: true,
                        title: 'Not able to find your project or team?',
                        actionString: 'Share URL',
                        iconURL: '/icons/sign-up/share.svg',
                        placeHolderText: 'Enter or paste URL here',
                      }}
                      id={'search-team-and-project'}
                      name={'search-team-and-project'}
                      placeHolder="Enter a name of your team or project"
                      onSelect={(suggestion) => {
                        setValue('teamOrProject', suggestion, { shouldValidate: true });
                      }}
                    />
                  </Field.Root>
                </div>
                <div className={s.col}>
                  <label className={s.Label}>
                    <Checkbox.Root className={s.Checkbox} checked={subscribe} onCheckedChange={(val) => setValue('subscribe', val, { shouldValidate: true })}>
                      <Checkbox.Indicator className={s.Indicator}>
                        <CheckIcon className={s.Icon} />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <div className={s.primary}>Subscribe to PL Newsletter</div>
                  </label>
                  <label className={s.Label}>
                    <Checkbox.Root className={s.Checkbox} checked={agreed} onCheckedChange={(val) => setValue('agreed', val as true, { shouldValidate: true })}>
                      <Checkbox.Indicator className={s.Indicator}>
                        <CheckIcon className={s.Icon} />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <div className={s.primary}>
                      I agree to Protocol Labs{' '}
                      <a href="https://protocol.ai/legal/" target="_blank">
                        Terms of Service and Privacy Policy
                      </a>
                    </div>
                  </label>
                </div>

                <p className={s.hint}>
                  You also allow Protocol Labs and companies within the network to contact you for events and opportunities within the network. Your information may only be shared with verified
                  network members and will not be available to any individuals or entities outside the network.
                </p>

                <button type="submit" className={s.actionButton} disabled={isSubmitting || !agreed || (submitCount > 0 && !isValid)}>
                  {isSubmitting ? (
                    <>
                      <LoaderIcon /> <span>Creating profile</span>
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
      <Script src={`https://www.google.com/recaptcha/api.js?render=${process.env.GOOGLE_SITE_KEY}`} strategy="lazyOnload"></Script>
    </>
  );
};

const LoaderIcon = () => <div className={s.loader} />;

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
