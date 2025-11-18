'use client';

import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Modal } from '@/components/common/Modal';
import { FormField } from '@/components/form/FormField';
import { Button } from '@/components/common/Button';
import { useApplyForDemoDay, ApplyForDemoDayPayload } from '@/services/demo-day/hooks/useApplyForDemoDay';
import { IUserInfo } from '@/types/shared.types';
import { IMember } from '@/types/members.types';

import s from './ApplyForDemoDayModal.module.scss';
import { FormSelect } from '@/components/form/FormSelect';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { Checkbox } from '@base-ui-components/react/checkbox';
import {
  CheckIcon,
  ExternalLinkIcon,
} from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/icons';
import Link from 'next/link';

const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

const applySchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Must be a valid email').required('Email is required'),
  linkedin: yup.string().required('Required'),
  teamOrProject: yup.string().required('Required'),
  role: yup.string().required('Role is required'),
  isInvestor: yup.boolean().defined(),
});

type ApplyFormData = yup.InferType<typeof applySchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userInfo?: IUserInfo | null;
  memberData?: IMember | null;
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

export const ApplyForDemoDayModal: React.FC<Props> = ({ isOpen, onClose, userInfo, memberData }) => {
  const { mutateAsync, isPending } = useApplyForDemoDay();
  const { data } = useMemberFormOptions();

  const methods = useForm<ApplyFormData>({
    defaultValues: {
      email: memberData?.email || userInfo?.email || '',
      name: memberData?.name || userInfo?.name || '',
      linkedin: memberData?.linkedinHandle || '',
      teamOrProject: memberData?.mainTeam?.name || '',
      role: memberData?.role || '',
      isInvestor: false,
    },
    resolver: yupResolver(applySchema),
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    // formState: { errors },
  } = methods;

  const isInvestor = watch('isInvestor');

  const onSubmit = async (data: ApplyFormData) => {
    try {
      await mutateAsync(data as ApplyForDemoDayPayload);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to submit application:', error);
    }
  };

  const handleClose = () => {
    reset();
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
            <h2 className={s.title}>PL Demo Day Application</h2>
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
              <a href="https://drive.google.com/file/d/1MjOF66asddB_hsg7Jc-7Oxk6L1EvYHxk/view">Terms & Conditions</a>.
            </p>
          </div>

          <FormProvider {...methods}>
            <form className={s.form} noValidate onSubmit={handleSubmit(onSubmit)}>
              <FormField name="email" label="Email Address" placeholder="Enter your email" isRequired />

              <FormField name="name" label="Full Name" placeholder="Enter your full name" isRequired />

              <FormField
                name="linkedin"
                label="LinkedIn profile"
                placeholder="Enter link to your LinkedIn profile"
                isRequired
              />

              <FormField name="role" label="Your Role" placeholder="e.g., CEO, CTO, Founder" isRequired />

              <div className={s.column}>
                <div className={s.inputsLabel}>Add Role & Team</div>
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
                  />
                </div>
              </div>

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
                </div>
              </label>

              <div className={s.footer}>
                <Button type="button" size="m" variant="secondary" style="border" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" size="m" style="fill" variant="primary" disabled={isPending}>
                  {isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </Modal>
  );
};
