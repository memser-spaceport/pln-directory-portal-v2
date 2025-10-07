import React, { useState } from 'react';
import { clsx } from 'clsx';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';

import { IUserInfo } from '@/types/shared.types';

import { INVEST_IN_VC_FUNDS_OPTIONS } from '@/constants/createTeam';

import { toast } from '@/components/core/ToastContainer';

import { useGetSaveTeam } from '@/hooks/createTeam/useGetSaveTeam';
import { useGetTeamsFormOptions } from '@/hooks/createTeam/useGetTeamsFormOptions';
import { useGetFundingStageOptions } from '@/hooks/createTeam/useGetFundingStageOptions';

import { Button } from '@/components/common/Button';
import TextField from '@/components/form/text-field';
import MultiSelect from '@/components/form/MultiSelect';
import { TagsInput } from '@/components/form/TagsInput';
import { FormField } from '@/components/form/form-field';
import SingleSelect from '@/components/form/single-select';
import { CurrencyInput } from '@/components/form/CurrencyInput';
import { Drawer, DrawerProps } from '@/components/common/Drawer';
import { ProfileImageInput } from '@/components/page/member-details/ProfileDetails/components/ProfileImageInput';

import { Option } from './types';

import { formatDataToSave } from './utils/formatDataToSave';

import { useGetAddRemoveHandlers } from './hooks/useGetAddRemoveHandlers';

import { CreateTeamForm, createTeamSchema } from './formSchema';

import { Label } from './components/Label';
import { Section } from './components/Section';

import s from './AddTeamDrawer.module.scss';
import { MembersQueryKeys } from '@/services/members/constants';
import { useQueryClient } from '@tanstack/react-query';

interface Props extends Omit<DrawerProps, 'header'> {
  userInfo: IUserInfo;
}

export function AddTeamDrawer(props: Props) {
  const { isOpen, userInfo } = props;
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();
  const formOptions = useGetTeamsFormOptions();
  const fundingStageOptions = useGetFundingStageOptions(formOptions?.fundingStage);

  const methods = useForm<CreateTeamForm>({
    defaultValues: {
      name: '',
      role: '',
      website: '',
      description: '',
      contactMethod: '',
      industryTags: [],
      fundTypes: [],
      startupStages: [],
      investmentFocus: [],
      isInvestmentFund: ['L5', 'L6'].includes(userInfo?.accessLevel ?? ''),
    },
    // TODO figure out damn types
    // @ts-ignore
    resolver: yupResolver(createTeamSchema),
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = methods;

  const data = watch();
  const {
    name,
    role,
    image,
    website,
    checkSize,
    fundTypes,
    description,
    fundingStage,
    industryTags,
    startupStages,
    contactMethod,
    investmentFocus,
    isInvestmentFund,
  } = data;

  const tagHandlers = useGetAddRemoveHandlers(industryTags, 'id');
  const fundTypeHandlers = useGetAddRemoveHandlers(fundTypes, 'value');
  const startupStageHandlers = useGetAddRemoveHandlers(startupStages, 'value');

  const hiddenClass = clsx({
    [s.hidden]: !isInvestmentFund,
  });

  const saveTeam = useGetSaveTeam(() => {
    queryClient.invalidateQueries({
      queryKey: [MembersQueryKeys.GET_MEMBER, userInfo.uid],
    });
    props.onClose();
    toast.success('Team submitted successfully');
  });

  const onSubmit = async (data: any) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const dataToSave = formatDataToSave(data, userInfo);
      await saveTeam(dataToSave);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      toast.error('Failed to submit team. Please try again.');
    }
  };

  function onClose() {
    reset();
    setIsLoading(false);
    props.onClose();
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <FormProvider {...methods}>
        <div className={s.root}>
          <div className={s.header}>
            <div>Submit a team</div>
            <div className={s.subheader}>Tell us about your team.</div>
          </div>

          <div className={s.content}>
            <Section header="Team Profile Details">
              <div className={s.teamNameSection}>
                <ProfileImageInput
                  member={{
                    name,
                    profile: '/icons/content.svg',
                  }}
                  classes={{
                    root: s.image,
                    dropzoneIcon: image ? '' : s.dropzoneIcon,
                  }}
                />

                <FormField name="name">
                  <TextField
                    value={name}
                    defaultValue={name}
                    isError={!!errors['name']}
                    name="name"
                    type="text"
                    label={<Label mandatory>Team name</Label>}
                    placeholder="Enter team name"
                    onChange={(e) => setValue('name', e.target.value, { shouldValidate: true })}
                  />
                </FormField>
              </div>

              <FormField name="role">
                <TextField
                  value={role || ''}
                  defaultValue={role || ''}
                  isError={!!errors['role']}
                  name="role"
                  type="text"
                  label={<Label>Role</Label>}
                  placeholder="Enter your role"
                  onChange={(e) => setValue('role', e.target.value, { shouldValidate: true })}
                />
              </FormField>

              <FormField name="description">
                <TextField
                  value={description}
                  defaultValue={description}
                  isError={!!errors['description']}
                  name="description"
                  type="description"
                  label={<Label mandatory>Short Description</Label>}
                  placeholder="Enter short description here"
                  onChange={(e) => setValue('description', e.target.value, { shouldValidate: true })}
                />
                <div className={s.subLabel}>150 characters max.</div>
              </FormField>

              <FormField name="fundingStage">
                <SingleSelect
                  id=""
                  uniqueKey="id"
                  displayKey="name"
                  placeholder="Select company stage"
                  options={formOptions?.fundingStage || []}
                  selectedOption={fundingStage}
                  onItemSelect={(opt) => setValue('fundingStage', opt as Option, { shouldValidate: true })}
                  arrowImgUrl="/icons/arrow-down.svg"
                  label={<Label mandatory>Company Stage</Label>}
                />
              </FormField>

              <FormField name="industryTags">
                <MultiSelect
                  options={formOptions?.industryTags || []}
                  selectedOptions={industryTags}
                  onAdd={(item) =>
                    setValue('industryTags', tagHandlers.addItem(item as Option), { shouldValidate: true })
                  }
                  onRemove={(item) =>
                    setValue('industryTags', tagHandlers.removeItem(item as Option), { shouldValidate: true })
                  }
                  uniqueKey="id"
                  displayKey="name"
                  label={<Label mandatory>Industry Tags</Label>}
                  placeholder="Search or select industry tags"
                  closeImgUrl="/icons/close.svg"
                  arrowImgUrl="/icons/arrow-down.svg"
                />
              </FormField>
            </Section>

            <Section header="Contact Details">
              <FormField name="website">
                <TextField
                  value={website}
                  defaultValue={website}
                  isError={!!errors['website']}
                  name="website"
                  type="text"
                  label={<Label mandatory>Website address</Label>}
                  placeholder="Enter website"
                  onChange={(e) => setValue('website', e.target.value, { shouldValidate: true })}
                />
              </FormField>

              <FormField name="contactMethod">
                <TextField
                  value={contactMethod}
                  defaultValue={contactMethod}
                  isError={!!errors['contactMethod']}
                  name="contactMethod"
                  type="text"
                  label={<Label mandatory>Preferred method of contact</Label>}
                  placeholder="Enter method of contact"
                  onChange={(e) => setValue('contactMethod', e.target.value, { shouldValidate: true })}
                />
              </FormField>
            </Section>

            <Section header="Investor Profile" delimiter={false}>
              <div className={s.isFund}>
                <input
                  name="isFund"
                  type="checkbox"
                  id="team-investment-fund"
                  checked={isInvestmentFund}
                  className={s.checkbox}
                  onChange={(e) => setValue('isInvestmentFund', e.target.checked, { shouldValidate: true })}
                />
                <label htmlFor="team-investment-fund">This team is an investment fund.</label>
              </div>

              <FormField name="fundTypes" className={hiddenClass}>
                <MultiSelect
                  options={INVEST_IN_VC_FUNDS_OPTIONS}
                  selectedOptions={fundTypes}
                  onAdd={(item) => setValue('fundTypes', fundTypeHandlers.addItem(item), { shouldValidate: true })}
                  onRemove={(item) =>
                    setValue('fundTypes', fundTypeHandlers.removeItem(item), { shouldValidate: true })
                  }
                  uniqueKey="label"
                  displayKey="label"
                  label={<Label>Type of fund(s) you invest in?</Label>}
                  placeholder="Select fund types (e.g., Early stage, Late stage, Fund-of-funds)"
                  closeImgUrl="/icons/close.svg"
                  arrowImgUrl="/icons/arrow-down.svg"
                />
              </FormField>

              <FormField name="startupStages" className={hiddenClass}>
                <MultiSelect
                  options={fundingStageOptions}
                  selectedOptions={startupStages}
                  onAdd={(item) =>
                    setValue('startupStages', startupStageHandlers.addItem(item), { shouldValidate: true })
                  }
                  onRemove={(item) =>
                    setValue('startupStages', startupStageHandlers.removeItem(item), { shouldValidate: true })
                  }
                  uniqueKey="label"
                  displayKey="label"
                  label={<Label>Startup stage(s) you invest in?</Label>}
                  placeholder="Select fund types (e.g., Early stage, Late stage, Fund-of-funds)"
                  closeImgUrl="/icons/close.svg"
                  arrowImgUrl="/icons/arrow-down.svg"
                />
              </FormField>

              <FormField name="checkSize" className={hiddenClass}>
                <CurrencyInput
                  defaultValue={checkSize}
                  label="Typical Check Size"
                  name="typicalCheckSize"
                  placeholder="E.g. $250.000"
                  variant="secondary"
                  onChange={(value) => setValue('checkSize', value, { shouldValidate: true })}
                />
              </FormField>

              <FormField name="investmentFocus" className={hiddenClass}>
                <TagsInput
                  defaultValue={investmentFocus}
                  selectLabel="Add Investment Focus"
                  name="investmentFocus"
                  placeholder="Add Keywords. E.g. AI, Staking, Governance, etc."
                  variant="secondary"
                  onChange={(tags) => setValue('investmentFocus', tags, { shouldValidate: true })}
                />
              </FormField>
            </Section>
          </div>

          <div className={s.footer}>
            <Button variant="secondary" style="border" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>

            <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </FormProvider>
    </Drawer>
  );
}
