'use client';

import { KeyboardEvent, useEffect, useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { FormField } from '@/components/form/FormField';
// Production's rich-text field, RHF-bound and `dynamic(ssr:false)` internally —
// safe on a server-rendered prototype route. `simplified` keeps mentions off so
// no member-search call fires.
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { FormSwitch } from '@/components/form/FormSwitch';
import { MonthYearSelect } from '@/components/form/MonthYearSelect';
import { OfficeHoursFormField } from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursFormField';
import ConfirmDialog from '@/components/core/ConfirmDialog/ConfirmDialog';
import { getProfileFromURL } from '@/utils/common.utils';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { toSocialFieldInputValue } from '@/utils/profile/toSocialFieldInputValue';

// Each form wears the sheet production wrote for it — the white panel, its `.row`
// measure, and for the experience form its red `.deleteBtn`. Four sheets, not
// one, because production keeps four.
import f from '@/components/page/member-details/ProfileDetails/components/EditProfileForm/EditProfileForm.module.scss';
import x from '@/components/page/member-details/ExperienceDetails/components/EditExperienceForm/EditExperienceForm.module.scss';
import di from '@/components/page/member-details/ExperienceDetails/components/ExperienceDatesInput/ExperienceDatesInput.module.scss';
import ct from '@/components/page/member-details/ContactDetails/components/EditContactForm/EditContactForm.module.scss';
import oh from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursForm/EditOfficeHoursForm.module.scss';
// The job board's one-date-per-row fix for the dates block at desktop width.
import jp from '../../job-board/JobProfilePane.module.scss';

// The tags input with the grey DS ✕ (lesson 8) — the same one every other
// prototype editor uses for skills and keywords.
import { SkillsTagsInput } from '../../job-board/SkillsTagsInput';
import type { ExperienceEntry } from '../../job-board/viewerState';
import { isoToYm, ymToIso } from '../ExperienceImport/dateBridge';

import { SectionEditorControls, SectionEditorTitle } from './SectionEditor';
import type { ContactHandles, ProfileRecord } from './types';
import s from './SectionEditor.module.scss';

/**
 * The four editors a profile page opens over its cards — the header card,
 * Office Hours, Contact Details, an Experience entry — each production's form
 * field for field with two changes shared by all of them:
 *
 *  1. the controls row is split — title above the fields, Cancel/Save below
 *     them (`SectionEditor`);
 *  2. nothing posts anywhere — Save hands the trimmed values to the host page,
 *     which writes them into its record.
 *
 * Two hosts: the filled profile (`member-profile-edit`) and the brand-new one
 * (`onboarding`). Both hand in a `ProfileRecord` and take a patch back; the
 * forms do not know which page they are on.
 *
 * What is *not* transcribed is said at each form: production's location is a
 * country/region/city select trio and its primary team a select over the teams
 * API, both needing options a mocked folder cannot fetch, so they are text
 * fields here.
 */

/* Production's form-level Enter guard, on every form here as it is on every
   form there: Enter commits a tag or a select and must not also submit. */
const preventEnterSubmit = (ev: KeyboardEvent<HTMLFormElement>) => {
  if (ev.key === 'Enter') ev.preventDefault();
};

/* This Quill build serializes every space as `&nbsp;`. Stored that way, a bio
   or a description can never wrap when the profile renders it — one unbroken
   line running off the card. Spaces go back to spaces on the way out.

   And an empty field leaves as an empty string. Quill has more than one way
   of saying nothing — `<p><br></p>` when a field is cleared, and `<p></p>`
   when a field that mounted empty is submitted untouched, which is what the
   new-member page's first Save does — and every read view tests for the first
   and the bare string only (`ProfileDetails` L34, and the four `hasBio`s that
   copy it). The second slipped past them and drew a titled, empty Bio block on
   a header card whose "+ Add bio" pill had just vanished. Normalised here,
   once, so no host has to learn a third spelling of empty. */
const fromQuill = (html: string) => {
  const clean = html.replace(/&nbsp;/g, ' ');
  return /^(\s|<p>|<\/p>|<br\s*\/?>)*$/.test(clean) ? '' : clean;
};

/* --------------------------------------------------------- profile details --- */

export type ProfilePatch = Pick<ProfileRecord, 'name' | 'role' | 'team' | 'location' | 'skills' | 'openToWork' | 'bio'>;

type ProfileFormData = {
  name: string;
  role: string;
  team: string;
  location: string;
  skills: string[];
  openToCollaborate: boolean;
  bio: string;
};

/** `EditProfileForm`: name, location, skills, open to collaborate, primary role & team, bio. */
export function ProfileDetailsForm({
  profile,
  onClose,
  onSubmit,
}: {
  profile: ProfileRecord;
  onClose: () => void;
  onSubmit: (patch: ProfilePatch) => void;
}) {
  const methods = useForm<ProfileFormData>({
    mode: 'onSubmit',
    defaultValues: {
      name: profile.name,
      role: profile.role,
      team: profile.team,
      location: profile.location,
      skills: [...profile.skills],
      openToCollaborate: profile.openToWork,
      bio: profile.bio,
    },
  });

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={methods.handleSubmit((data) =>
          onSubmit({
            name: data.name.trim(),
            role: data.role.trim(),
            team: data.team.trim(),
            location: data.location.trim(),
            skills: data.skills ?? [],
            openToWork: data.openToCollaborate,
            bio: fromQuill(data.bio),
          }),
        )}
        onKeyDown={preventEnterSubmit}
      >
        <SectionEditorTitle title="Edit Profile Details" />

        <div className={clsx(f.body, s.formBody)}>
          {/* Production pairs the avatar picker with Name in this row; the
              picker posts an image and is left out. */}
          <div className={f.row}>
            <FormField
              name="name"
              label="Name"
              isRequired
              placeholder="Text"
              rules={{ required: 'Name is required' }}
            />
          </div>
          {/* `ProfileLocationInput` in production — three selects fed by a
              locations API. One text field here. */}
          <div className={f.row}>
            <FormField name="location" label="Location" placeholder="e.g. Lisbon, Portugal" />
          </div>
          <div className={f.row}>
            <SkillsTagsInput name="skills" selectLabel="Skills" placeholder="Add a skill" />
          </div>
          <div className={f.row}>
            <FormSwitch name="openToCollaborate" label="Open to Collaborate" />
          </div>

          <div className={f.column}>
            <div className={f.inputsLabel}>Primary Role & Team</div>
            <div className={f.inputsWrapper}>
              <FormField name="role" placeholder="Enter your primary role" />
              <span>@</span>
              {/* A `FormSelect` over the teams API in production. */}
              <FormField name="team" placeholder="Search or add a team" />
            </div>
            <div className={f.description}>Add your role and team so others can connect with you.</div>
          </div>

          <div className={f.row}>
            <FormEditor name="bio" label="Bio" simplified placeholder="Tell others about yourself" />
          </div>
        </div>

        <SectionEditorControls onClose={onClose} />
      </form>
    </FormProvider>
  );
}

/* ------------------------------------------------------------ office hours --- */

export type OfficeHoursPatch = Pick<ProfileRecord, 'officeHours' | 'ohInterest' | 'ohHelpWith'>;

type OfficeHoursFormData = {
  officeHours: string;
  officeHoursInterestedIn: string[];
  officeHoursCanHelpWith: string[];
};

/* `OfficeHoursFormField` renders the async link check's result out of this map;
   the check is a production mutation, so the map stays empty and the field just
   takes what is typed. */
const NO_VALIDATION = new Map<string, { isValid: boolean; error?: string }>();

/** `EditOfficeHoursForm`: the link, then the two keyword lists, labels verbatim. */
export function OfficeHoursForm({
  profile,
  onClose,
  onSubmit,
}: {
  profile: ProfileRecord;
  onClose: () => void;
  onSubmit: (patch: OfficeHoursPatch) => void;
}) {
  const methods = useForm<OfficeHoursFormData>({
    mode: 'onSubmit',
    defaultValues: {
      officeHours: profile.officeHours,
      officeHoursInterestedIn: [...profile.ohInterest],
      officeHoursCanHelpWith: [...profile.ohHelpWith],
    },
  });

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={methods.handleSubmit((data) =>
          onSubmit({
            officeHours: data.officeHours.trim(),
            ohInterest: data.officeHoursInterestedIn ?? [],
            ohHelpWith: data.officeHoursCanHelpWith ?? [],
          }),
        )}
        onKeyDown={preventEnterSubmit}
      >
        <SectionEditorTitle title="Edit Office Hours" />

        <div className={clsx(oh.body, s.formBody)}>
          <div className={oh.row}>
            <OfficeHoursFormField
              name="officeHours"
              label="Office Hours"
              placeholder="Enter Office Hours link"
              description="Drop your calendar link here so others can get in touch with you at a time that is convenient. We recommend 15-min meetings scheduled."
              validationCache={NO_VALIDATION}
            />
          </div>
          <div className={oh.row}>
            <SkillsTagsInput
              name="officeHoursInterestedIn"
              selectLabel="I am interested in:"
              placeholder="Add keywords (e.g. Web3, AI, Neurotech, etc.)"
            />
          </div>
          <div className={oh.row}>
            <SkillsTagsInput
              name="officeHoursCanHelpWith"
              selectLabel="I can help with:"
              placeholder="Add keywords (e.g. Early-stage Startups, Product Design, etc.)"
            />
          </div>
        </div>

        <SectionEditorControls onClose={onClose} />
      </form>
    </FormProvider>
  );
}

/* --------------------------------------------------------- contact details --- */

export type ContactPatch = Pick<ProfileRecord, 'contacts' | 'shareContacts'>;

type ContactFormData = ContactHandles & { shareContacts: boolean };

const CONTACT_ROWS: Array<{ name: keyof ContactHandles; label: string; placeholder: string; required?: boolean }> = [
  { name: 'email', label: 'Email', placeholder: 'Enter your email', required: true },
  { name: 'linkedin', label: 'LinkedIn', placeholder: 'eg., johndoe or https://linkedin.com/in/johndoe' },
  { name: 'telegram', label: 'Telegram', placeholder: 'eg., @username or https://t.me/username' },
  { name: 'github', label: 'Github', placeholder: 'eg., username or https://github.com/username' },
  { name: 'discord', label: 'Discord', placeholder: 'eg., username or https://discord.com/users/username' },
  { name: 'twitter', label: 'X (Twitter)', placeholder: 'eg., @protocollabs or https://twitter.com/protocollabs' },
  {
    name: 'bluesky',
    label: 'Bluesky',
    placeholder: 'eg., @protocol.ai, protocol.ai or https://bsky.app/profile/protocol.ai',
  },
];

/**
 * `EditContactForm`: the seven handles with their provider logos, then the
 * visibility switch. Handles are seeded with the `@` the X / Telegram / Bluesky
 * fields require and stored bare again on save, through the same two helpers
 * production uses in each direction.
 *
 * One deviation: production disables Email for the owner and routes a change
 * through a verification flow behind a pencil in the field. Neither exists in a
 * mock, and a disabled field with no way to change it is a dead control — so
 * the field is live here.
 */
export function ContactForm({
  profile,
  onClose,
  onSubmit,
}: {
  profile: ProfileRecord;
  onClose: () => void;
  onSubmit: (patch: ContactPatch) => void;
}) {
  const { contacts } = profile;
  const methods = useForm<ContactFormData>({
    mode: 'onSubmit',
    defaultValues: {
      email: contacts.email,
      linkedin: contacts.linkedin,
      telegram: toSocialFieldInputValue('telegram', contacts.telegram) ?? '',
      github: contacts.github,
      discord: contacts.discord,
      twitter: toSocialFieldInputValue('twitter', contacts.twitter) ?? '',
      bluesky: toSocialFieldInputValue('bluesky', contacts.bluesky) ?? '',
      shareContacts: profile.shareContacts,
    },
  });

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={methods.handleSubmit((data) =>
          onSubmit({
            contacts: {
              email: data.email.trim(),
              linkedin: getProfileFromURL(data.linkedin, 'linkedin') ?? '',
              telegram: getProfileFromURL(data.telegram, 'telegram') ?? '',
              github: getProfileFromURL(data.github, 'github') ?? '',
              discord: getProfileFromURL(data.discord, 'discord') ?? '',
              twitter: getProfileFromURL(data.twitter, 'twitter') ?? '',
              bluesky: getProfileFromURL(data.bluesky.trim(), 'bluesky') ?? '',
            },
            shareContacts: data.shareContacts,
          }),
        )}
        onKeyDown={preventEnterSubmit}
      >
        <SectionEditorTitle title="Edit Contact Details" />

        <div className={clsx(ct.body, s.formBody)}>
          {CONTACT_ROWS.map((row) => (
            <div key={row.name} className={ct.row}>
              <img src={getContactLogoByProvider(row.name)} alt="" height={24} width={24} />
              <FormField
                name={row.name}
                label={row.label}
                placeholder={row.placeholder}
                isRequired={row.required}
                rules={row.required ? { required: `${row.label} is required` } : undefined}
              />
            </div>
          ))}
          <div className={clsx(ct.row, ct.center)}>
            <div className={ct.switchLabelWrapper}>
              <div className={ct.switchLabel}>Show contact details to PL network members</div>
              <div className={ct.switchDesc}>Contact details are never displayed publicly</div>
            </div>
            <FormSwitch name="shareContacts" />
          </div>
        </div>

        <SectionEditorControls onClose={onClose} />
      </form>
    </FormProvider>
  );
}

/* -------------------------------------------------------------- experience --- */

type ExperienceFormData = {
  title: string;
  company: string;
  description: string;
  /** ISO while in the form — see `ymToIso`. */
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  location: string;
};

/* A key for a new entry. A counter rather than `Date.now()` — impure in render —
   and never shown; production mints `uid` server-side. */
let uidSeq = 0;
const mintUid = (): string => `exp-new-${(uidSeq += 1)}`;

/**
 * The job board's `ExperienceForm` (itself `EditExperienceForm`, field for
 * field), with the controls moved below the fields. Not imported, because the
 * exported one draws production's controls row above the fields — the one thing
 * this entry changes.
 */
export function ExperienceEditForm({
  initial,
  onClose,
  onSubmit,
  onDelete,
}: {
  initial: ExperienceEntry | null;
  onClose: () => void;
  onSubmit: (entry: ExperienceEntry) => void;
  onDelete: (uid: string) => void;
}) {
  const isNew = !initial;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const methods = useForm<ExperienceFormData>({
    mode: 'onSubmit',
    defaultValues: {
      title: initial?.title ?? '',
      company: initial?.company ?? '',
      description: initial?.description ?? '',
      startDate: ymToIso(initial?.startDate ?? null),
      endDate: ymToIso(initial?.endDate ?? null),
      isCurrent: initial?.isCurrent ?? false,
      location: initial?.location ?? '',
    },
  });
  const {
    control,
    register,
    setValue,
    trigger,
    formState: { errors },
  } = methods;

  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });
  const isCurrent = useWatch({ control, name: 'isCurrent' });

  /* `MonthYearSelect` writes through `setValue`, so its rules are registered by
     name — RHF keeps a rule on a field whether or not an input ref attaches. */
  useEffect(() => {
    register('startDate', { required: 'Start date is required' });
    register('endDate', {
      validate: (value, values) => (values.isCurrent || !!value ? true : 'End date is required'),
    });
  }, [register]);

  /* Flipping Present on answers the end-date question, so its error clears
     with it rather than waiting for a second submit. */
  useEffect(() => {
    if (isCurrent && errors.endDate) trigger('endDate');
  }, [isCurrent, errors.endDate, trigger]);

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={methods.handleSubmit((data) =>
          onSubmit({
            uid: initial?.uid ?? mintUid(),
            title: data.title.trim(),
            company: data.company.trim(),
            description: fromQuill(data.description).trim(),
            startDate: isoToYm(data.startDate) ?? '',
            endDate: data.isCurrent ? null : isoToYm(data.endDate),
            isCurrent: data.isCurrent,
            location: data.location.trim(),
          }),
        )}
        onKeyDown={preventEnterSubmit}
      >
        <SectionEditorTitle title={isNew ? 'Add Experience' : 'Edit Experience'} />

        <div className={clsx(x.body, s.formBody)}>
          <div className={x.row}>
            <FormField
              name="title"
              label="Role"
              placeholder="Enter role"
              isRequired
              rules={{ required: 'Role is required' }}
            />
          </div>
          <div className={x.row}>
            <FormField
              name="company"
              label="Team or Organization"
              placeholder="Enter team or organization"
              isRequired
              rules={{ required: 'Team or organization is required' }}
            />
          </div>
          <div className={x.row}>
            <FormEditor
              name="description"
              label="Impact or Work Description"
              simplified
              placeholder="What you worked on there, and what it changed"
            />
          </div>
          <div className={di.root}>
            <div className={clsx(di.body, jp.datesBody)}>
              <MonthYearSelect
                label="Start Date"
                isRequired
                error={errors.startDate?.message}
                value={startDate ?? null}
                onChange={(val) => {
                  if (val === null) return;
                  setValue('startDate', val, { shouldValidate: true, shouldDirty: true });
                }}
              />
              <MonthYearSelect
                label="End Date"
                isRequired={!isCurrent}
                disabled={!!isCurrent}
                error={errors.endDate?.message}
                value={endDate ?? null}
                onChange={(val) => {
                  if (val === null) return;
                  setValue('endDate', val, { shouldValidate: true, shouldDirty: true });
                }}
              />
              <FormSwitch name="isCurrent" label="Present" />
            </div>
          </div>
          <div className={x.row}>
            <FormField name="location" label="Location" placeholder="Enter location" />
          </div>

          {!isNew && (
            <>
              <button className={x.deleteBtn} type="button" onClick={() => setConfirmDelete(true)}>
                <DeleteIcon /> Delete Experience
              </button>
              <ConfirmDialog
                title="Delete Experience"
                desc="Are you sure you want to delete selected experience?"
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => initial && onDelete(initial.uid)}
                confirmTitle="Delete"
              />
            </>
          )}
        </div>

        {/* A new entry is empty by definition, so its Save is live from the
            first frame; an existing one waits for a change, as production's does. */}
        <SectionEditorControls onClose={onClose} alwaysEnabled={isNew} />
      </form>
    </FormProvider>
  );
}

/** `EditExperienceForm`'s bin, as the job board copies it. */
const DeleteIcon = () => (
  <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.06641 1.24219C4.20312 0.941406 4.50391 0.75 4.83203 0.75H8.14062C8.46875 0.75 8.76953 0.941406 8.90625 1.24219L9.125 1.625H11.75C12.2148 1.625 12.625 2.03516 12.625 2.5C12.625 2.99219 12.2148 3.375 11.75 3.375H1.25C0.757812 3.375 0.375 2.99219 0.375 2.5C0.375 2.03516 0.757812 1.625 1.25 1.625H3.875L4.06641 1.24219ZM11.75 4.25L11.1484 13.5195C11.1211 14.2305 10.5469 14.75 9.83594 14.75H3.13672C2.42578 14.75 1.85156 14.2305 1.82422 13.5195L1.25 4.25H11.75Z"
      fill="#F71515"
    />
  </svg>
);
