'use client';

import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';
import { Checkbox } from '@base-ui-components/react/checkbox';
import type { ITeam } from '@/types/teams.types';
import { Drawer } from '@/components/common/Drawer';
import { Button } from '@/components/common/Button';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { EditButton } from '@/components/common/profile/EditButton';
import { TagsList } from '@/components/common/profile/TagsList';
import { CloseIcon } from '@/components/icons';
import { FormCurrencyField } from '@/components/form/FormCurrencyField';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete';
// By path, not the folder index — the index also exports the prompt banner,
// which pulls the investor-settings mutation in with it.
import { InvestmentDetailsSection } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components/InvestmentDetailsSection';
import { FundTeamCard } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components/FundTeamCard';
import { formatNumberToCurrency } from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/utils';
import {
  CheckIcon,
  ExternalLinkIcon,
  ExternalLinkIconBlue,
  InfoIconFilled,
} from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/icons';
// Drawer chrome is Demo Day's EditInvestorProfileDrawer — the component
// investors edit their profile in after applying — imported by class: sticky
// 64px header with Back, a 720px column of the member page's own sections.
import dr from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer.module.scss';
import h from '@/components/page/member-details/MemberDetailHeader/MemberDetailHeader.module.scss';
import p from '@/components/page/member-details/ProfileDetails/ProfileDetails.module.scss';
import contact from '@/components/page/member-details/ContactDetails/ContactDetails.module.scss';
import iv from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/InvestorProfileView.module.scss';
import ipd from '@/components/page/member-details/InvestorProfileDetails/InvestorProfileDetails.module.scss';
import ipb from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components/InvestorPromptBanner/InvestorPromptBanner.module.scss';
import ef from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/EditInvestorProfileForm.module.scss';
// The add-a-fund card is production's AddTeamInlineForm, by class (see AddFundInline).
import at from '@/components/form/AddTeamInlineForm/AddTeamInlineForm.module.scss';
// The section-editing pattern the member profile and onboarding share: one
// card open at a time, the rest inert, Cancel/Save under the fields.
import {
  EditorDirtyContext,
  Section,
  SectionEditorControls,
  SectionEditorTitle,
  editCardClass,
  editSectionClasses,
} from '../profile-shared/SectionEditor/SectionEditor';
import { ContactForm, ProfileDetailsForm } from '../profile-shared/SectionEditor/forms';
import { ContactHandlesList } from '../profile-shared/SectionEditor/views';
import type { ProfileRecord } from '../profile-shared/SectionEditor/types';
// Grey-✕ copies of production's FormMultiSelect / FormTagsInput (lesson 8).
import { PreferenceMultiSelect } from '../job-board/PreferenceMultiSelect';
import { SkillsTagsInput } from '../job-board/SkillsTagsInput';
import s from './SpvSpotlight.module.scss';

/**
 * Demo Day's `EditInvestorProfileDrawer`, for SPV investors: the same three
 * sections in the same order — the profile header card, Investor Details, and
 * Contact Details — so an investor who has been through Demo Day meets the
 * drawer they already know. One drawer, no wizard (review 2026-10-05:
 * investors drop off multi-step flows); each section edits in place.
 *
 * Production's drawer lets every section open its own editor with the
 * controls row on top. This one uses the shared section editor the
 * prototypes' member profile settled on (one card open at a time, the rest
 * muted, Cancel/Save after the fields).
 *
 * Investor Details matches production's `InvestorProfileDetails` +
 * `EditInvestorProfileForm` with `useInlineAddTeam` (the drawer's mode),
 * 2026-10-05:
 * - the view: `InvestorProfileView`'s blocks and show/hide rules by type
 *   (ANGEL / FUND / ANGEL_AND_FUND), and its incomplete state — the section
 *   turns `missingData` and `InvestorPromptBanner`'s amber `DataIncomplete`
 *   strip caps it, on production's own `shouldShowIncompleteDataWarning` rule;
 * - the form: "How do you invest (select all that apply)?" with the angel tick
 *   (stages, check size, focus) and the fund tick; the fund tick opens
 *   "Search and add an investment fund" with the picked fund's info box, Role,
 *   and either the lead's fund fields or the "You don't have access to edit
 *   team information" box; and "add your team" in the select's not-found row
 *   opens the inline add-a-fund card, created on Save.
 *
 * Deliberate deviations: the fields that still need filling are marked amber
 * (review 2026-10-05) — the empty `+ Add …` pills in the view and the empty
 * fields in the form; the "Email me deals that match" tick stays (2026-10-01
 * standup); Contact Support opens the prototypes' copy of the support modal;
 * selects are the grey-✕ copies. Dropped: the interactive "Do you invest in
 * startups?" banner (an SPV investor is an investor by invitation) and the
 * "Manage your investor settings" block (production hides it in the drawer).
 */

export type InvestorRecord = {
  /** "I angel invest as an accredited investor under SEC rules" (secRulesAccepted) */
  angel: boolean;
  stages: string[];
  checkSize: string;
  focus: string[];
  /** "I invest through fund(s)." (isInvestViaFund) */
  viaFund: boolean;
  fundId: string | null;
  fundRole: string;
  /** "Email me deals that match" — added 2026-10-01 for SPV Spotlight. */
  dealEmails: boolean;
};

/** A directory team marked as an investment fund, as the drawer needs it. */
export type SpvFund = {
  id: string;
  name: string;
  logo: string;
  website: string;
  /** Whether this investor leads the team — only leads edit the fund's details. */
  teamLead: boolean;
  investorProfile: {
    investInFundTypes: string[];
    typicalCheckSize: string;
    investInStartupStages: string[];
    investmentFocus: string[];
  };
};

/** Has this person told us how they invest at all? Production's `type` being set. */
export const hasInvestorProfile = (r: InvestorRecord) => r.angel || r.viaFund;

const deriveType = (r: InvestorRecord) =>
  r.angel && r.viaFund ? 'ANGEL_AND_FUND' : r.angel ? 'ANGEL' : r.viaFund ? 'FUND' : null;

// Production's `shouldShowIncompleteDataWarning`, on the prototype's record.
const isIncomplete = (r: InvestorRecord, fund: SpvFund | undefined) => {
  const angelEmpty = r.stages.length === 0 && !r.checkSize && r.focus.length === 0;
  switch (deriveType(r)) {
    case 'ANGEL':
      return angelEmpty;
    case 'FUND':
      return !fund;
    case 'ANGEL_AND_FUND':
      return !fund || angelEmpty;
    default:
      return true;
  }
};

type Target = 'profile' | 'investor' | 'contact' | null;

// Production's funding-stage options (useTeamsFormOptions, filtered), and its
// literal fund types.
const STAGE_OPTIONS = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D and later'].map((v) => ({
  value: v,
  label: v,
}));
const FUND_TYPE_OPTIONS = ['Early stage', 'Late stage', 'Fund-of-funds', 'Growth'].map((v) => ({ value: v, label: v }));

const FUND_LOGO_FALLBACK = '/images/demo-day/profile-placeholder.svg';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileRecord;
  onProfileChange: (next: ProfileRecord) => void;
  investor: InvestorRecord;
  onInvestorChange: (next: InvestorRecord) => void;
  funds: SpvFund[];
  onFundsChange: (next: SpvFund[]) => void;
  /** Production's Contact Support (the no-access fund box). */
  onContactSupport: () => void;
};

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M17.5 10a.625.625 0 0 1-.625.625H4.634l4.558 4.558a.625.625 0 1 1-.884.884l-5.625-5.625a.625.625 0 0 1 0-.884l5.625-5.625a.625.625 0 1 1 .884.884L4.634 9.375h12.241A.625.625 0 0 1 17.5 10Z"
      fill="currentColor"
    />
  </svg>
);

export const SpvInvestorProfileDrawer = ({
  isOpen,
  onClose,
  profile,
  onProfileChange,
  investor,
  onInvestorChange,
  funds,
  onFundsChange,
  onContactSupport,
}: Props) => {
  const [editing, setEditing] = useState<Target>(null);
  const [, setDirty] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);

  const close = () => setEditing(null);
  const is = (t: NonNullable<Target>) => editing === t;
  const sectionProps = (t: NonNullable<Target>) => ({
    muted: editing !== null && editing !== t,
    ref: editing === t ? editRef : undefined,
    className: s.drawerSection,
  });
  const hasBio = profile.bio.trim() !== '' && profile.bio.trim() !== '<p><br></p>';

  const fund = investor.viaFund ? funds.find((f) => f.id === investor.fundId) : undefined;
  // Production: `!editView && isOwner && shouldShowIncompleteDataWarning(member)`.
  const incomplete = !is('investor') && isIncomplete(investor, fund);

  return (
    // `onClose` is a no-op on purpose, as in production's
    // EditInvestorProfileDrawer: Escape inside a select or a stray overlay
    // click would otherwise close the drawer and drop an open edit. Back is
    // the only way out.
    <Drawer isOpen={isOpen} onClose={() => {}} noBlur>
      <div className={dr.drawerHeader}>
        <div className={dr.breadcrumbs}>
          <button
            className={dr.backButton}
            onClick={() => {
              setEditing(null);
              onClose();
            }}
          >
            <BackIcon />
            <span>Back</span>
          </button>
        </div>
      </div>

      <EditorDirtyContext.Provider value={setDirty}>
        <div className={dr.drawerContent}>
          {/* 1. Profile header card — production's ProfileDetails, `investor-drawer` variant. */}
          <Section {...sectionProps('profile')}>
            <div className={clsx(p.root, is('profile') && [p.editView, editCardClass])}>
              {is('profile') ? (
                <ProfileDetailsForm
                  profile={profile}
                  onClose={close}
                  onSubmit={(patch) => {
                    onProfileChange({ ...profile, ...patch });
                    close();
                  }}
                />
              ) : (
                <>
                  <div className={h.header}>
                    <div className={h.headerProfile}>
                      <img className={h.headerProfileImg} src={profile.avatar} alt={profile.name} />
                    </div>
                    <div className={h.headerDetails}>
                      <div>
                        <div className={h.specificsHdr}>
                          <h2 className={h.specificsName}>{profile.name}</h2>
                        </div>
                        <div className={h.roleAndLocation}>
                          <div className={h.teams}>
                            <p className={h.teamsName}>{profile.team}</p>
                          </div>
                          <div className={clsx(h.divider, h.desktopOnly)} />
                          <p className={h.role}>{profile.role}</p>
                          {profile.location && (
                            <>
                              <div className={h.divider} />
                              <div className={h.location}>
                                <p className={h.locationName}>{profile.location}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <EditButton onClick={() => setEditing('profile')} />
                      </div>
                    </div>
                    {profile.skills.length > 0 && (
                      <div className={h.tags}>
                        <TagsList tags={profile.skills.map((title) => ({ title }))} tagsToShow={5} />
                      </div>
                    )}
                  </div>
                  {hasBio && (
                    <div className={p.bioContainer}>
                      <div className={p.bioTitle}>Bio</div>
                      <div className={p.bioContent} dangerouslySetInnerHTML={{ __html: profile.bio }} />
                    </div>
                  )}
                </>
              )}
            </div>
          </Section>

          {/* 2. Investor Details — production's InvestorProfileDetails composition. */}
          <Section {...sectionProps('investor')}>
            <DetailsSection
              editView={is('investor')}
              missingData={incomplete}
              classes={{
                ...editSectionClasses(is('investor')),
                root: clsx(ipd.root, editSectionClasses(is('investor'))?.root),
              }}
            >
              {is('investor') ? (
                <InvestorForm
                  investor={investor}
                  funds={funds}
                  onContactSupport={onContactSupport}
                  onClose={close}
                  onSubmit={(next, nextFunds) => {
                    onInvestorChange(next);
                    onFundsChange(nextFunds);
                    close();
                  }}
                />
              ) : (
                <InvestorView
                  investor={investor}
                  fund={fund}
                  incomplete={incomplete}
                  onEdit={() => setEditing('investor')}
                />
              )}
            </DetailsSection>
          </Section>

          {/* 3. Contact Details — editable, as production's `drawer` variant. */}
          <Section {...sectionProps('contact')}>
            <DetailsSection editView={is('contact')} classes={editSectionClasses(is('contact'))}>
              {is('contact') ? (
                <ContactForm
                  profile={profile}
                  onClose={close}
                  onSubmit={(patch) => {
                    onProfileChange({ ...profile, ...patch });
                    close();
                  }}
                />
              ) : (
                <div className={contact.contentRoot}>
                  <DetailsSectionHeader title="Contact Details">
                    <EditButton onClick={() => setEditing('contact')} />
                  </DetailsSectionHeader>
                  <div className={contact.container}>
                    <ContactHandlesList contacts={profile.contacts} />
                  </div>
                </div>
              )}
            </DetailsSection>
          </Section>
        </div>
      </EditorDirtyContext.Provider>
    </Drawer>
  );
};

/* ---------- Investor Details: view ---------- */

// Copy-simplified InvestorProfileView: the same prompt strip, header, blocks
// and show/hide rules by type.
function InvestorView({
  investor,
  fund,
  incomplete,
  onEdit,
}: {
  investor: InvestorRecord;
  fund: SpvFund | undefined;
  incomplete: boolean;
  onEdit: () => void;
}) {
  const type = deriveType(investor);
  const showFundTeams = (type === 'ANGEL_AND_FUND' || type === 'FUND') && !!fund;
  const showEmptyFundState = type === 'FUND' && !fund;
  const showDirect = type === 'ANGEL' || type === 'ANGEL_AND_FUND' || !type;
  const showDirectHeader = !!investor.checkSize || investor.stages.length > 0 || investor.focus.length > 0;

  return (
    <>
      {/* InvestorPromptBanner's non-interactive branch: the amber strip. */}
      {incomplete && (
        <DataIncomplete className={ipb.incompleteStrip}>
          Review your investor details; founders see this when you&apos;re introduced.
        </DataIncomplete>
      )}

      {/* `needsFillPills`: every `+ Add …` pill here is a field still empty,
          so all of them wear amber (review 2026-10-05; production's are grey). */}
      <div className={clsx(iv.root, incomplete && iv.missingData, s.needsFillPills)}>
        <DetailsSectionHeader title="Investor Details">
          <EditButton onClick={onEdit} />
        </DetailsSectionHeader>
        <div className={iv.content}>
          {showFundTeams && fund && (
            <div className={iv.block}>
              <div className={iv.blockTitle}>Investment through fund(s)</div>
              <FundTeamCard team={fund as unknown as ITeam} isEditable />
            </div>
          )}
          {showEmptyFundState && (
            <div className={iv.block}>
              <InvestmentDetailsSection isEditable onEdit={onEdit} />
            </div>
          )}
          {showDirect && (
            <div className={iv.block}>
              {showDirectHeader && <div className={iv.blockTitle}>Direct Investments</div>}
              <InvestmentDetailsSection
                typicalCheckSize={investor.checkSize || undefined}
                investmentFocusAreas={investor.focus}
                investInStartupStages={investor.stages}
                secRulesAccepted={investor.angel}
                isEditable
                onEdit={onEdit}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- Investor Details: form ---------- */

type Option = { value: string; label: string; originalObject?: SpvFund };

type InvestorFormValues = {
  angel: boolean;
  stages: Option[];
  checkSize: string;
  focus: string[];
  viaFund: boolean;
  dealEmails: boolean;
  team: Option | null;
  teamRole: string;
  website: string;
  teamStages: Option[];
  teamCheckSize: string;
  teamFocus: string[];
  teamFundTypes: Option[];
  newTeamName: string;
  newTeamWebsite: string;
  newTeamRole: string;
};

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));
const digits = (v: unknown) => String(v ?? '').replace(/[^0-9.]/g, '');
const fundOption = (f: SpvFund): Option => ({ value: f.id, label: f.name, originalObject: f });

function InvestorForm({
  investor,
  funds,
  onContactSupport,
  onClose,
  onSubmit,
}: {
  investor: InvestorRecord;
  funds: SpvFund[];
  onContactSupport: () => void;
  onClose: () => void;
  onSubmit: (next: InvestorRecord, nextFunds: SpvFund[]) => void;
}) {
  const current = funds.find((f) => f.id === investor.fundId);
  const methods = useForm<InvestorFormValues>({
    defaultValues: {
      angel: investor.angel,
      stages: toOptions(investor.stages),
      checkSize: formatNumberToCurrency(investor.checkSize),
      focus: investor.focus,
      viaFund: investor.viaFund,
      dealEmails: investor.dealEmails,
      team: current ? fundOption(current) : null,
      teamRole: investor.fundRole,
      website: current?.website ?? '',
      teamStages: toOptions(current?.investorProfile.investInStartupStages ?? []),
      teamCheckSize: formatNumberToCurrency(current?.investorProfile.typicalCheckSize),
      teamFocus: current?.investorProfile.investmentFocus ?? [],
      teamFundTypes: toOptions(current?.investorProfile.investInFundTypes ?? []),
      newTeamName: '',
      newTeamWebsite: '',
      newTeamRole: '',
    },
  });
  const { watch, setValue, setError, handleSubmit } = methods;
  const angel = watch('angel');
  const viaFund = watch('viaFund');
  const dealEmails = watch('dealEmails');
  const selectedTeam = watch('team');
  const [addingInline, setAddingInline] = useState(false);
  const teamSelectRef = useRef(null);

  const selectedFund = funds.find((f) => f.id === selectedTeam?.value);
  const isTeamLead = !!selectedFund?.teamLead;

  // The fields that still need filling, marked amber (review 2026-10-05).
  const empty = {
    how: !angel && !viaFund,
    stages: watch('stages').length === 0,
    checkSize: !digits(watch('checkSize')),
    focus: watch('focus').length === 0,
    team: !selectedTeam,
    teamStages: watch('teamStages').length === 0,
    teamCheckSize: !digits(watch('teamCheckSize')),
  };

  // Production's handleTeamSelect: the picked fund's details fill the lead's fields.
  const handleTeamSelect = (opt: Option | null) => {
    const f = funds.find((x) => x.id === opt?.value);
    setValue('teamRole', f && f.id === investor.fundId ? investor.fundRole : '', { shouldDirty: true });
    setValue('website', f?.website ?? '', { shouldDirty: true });
    setValue('teamStages', toOptions(f?.investorProfile.investInStartupStages ?? []));
    setValue('teamCheckSize', formatNumberToCurrency(f?.investorProfile.typicalCheckSize));
    setValue('teamFocus', f?.investorProfile.investmentFocus ?? []);
    setValue('teamFundTypes', toOptions(f?.investorProfile.investInFundTypes ?? []));
  };

  const submit = (v: InvestorFormValues) => {
    let nextFunds = funds;
    let fundId = v.viaFund ? (v.team?.value ?? null) : null;
    let fundRole = v.teamRole;

    // Production's onSubmit with the inline add-team form open: validate it,
    // create the team (here: a mocked fund you lead), then save with it picked.
    if (v.viaFund && addingInline) {
      const missing: [keyof InvestorFormValues, string][] = [];
      if (!v.newTeamName.trim()) missing.push(['newTeamName', 'Team name is required']);
      if (!v.newTeamWebsite.trim()) missing.push(['newTeamWebsite', 'Website is required']);
      if (!v.newTeamRole.trim()) missing.push(['newTeamRole', 'Role is required']);
      if (v.teamStages.length === 0) missing.push(['teamStages', 'Select at least one startup stage']);
      if (!digits(v.teamCheckSize)) missing.push(['teamCheckSize', 'Typical check size is required']);
      if (missing.length) {
        missing.forEach(([name, message]) => setError(name, { type: 'manual', message }));
        return;
      }
      const created: SpvFund = {
        id: `fund-${Date.now()}`,
        name: v.newTeamName.trim(),
        logo: '',
        website: v.newTeamWebsite.trim(),
        teamLead: true,
        investorProfile: {
          investInFundTypes: v.teamFundTypes.map((o) => o.value),
          typicalCheckSize: digits(v.teamCheckSize),
          investInStartupStages: v.teamStages.map((o) => o.value),
          investmentFocus: v.teamFocus,
        },
      };
      nextFunds = [...funds, created];
      fundId = created.id;
      fundRole = v.newTeamRole.trim();
    } else if (v.viaFund && fundId) {
      // Only a lead writes the fund's own investment details.
      nextFunds = funds.map((f) =>
        f.id === fundId && f.teamLead
          ? {
              ...f,
              website: v.website,
              investorProfile: {
                investInFundTypes: v.teamFundTypes.map((o) => o.value),
                typicalCheckSize: digits(v.teamCheckSize),
                investInStartupStages: v.teamStages.map((o) => o.value),
                investmentFocus: v.teamFocus,
              },
            }
          : f,
      );
    }

    onSubmit(
      {
        angel: v.angel,
        stages: v.stages.map((o) => o.value),
        // FormCurrencyField holds its display string ("$250,000"); the
        // record keeps the number, as production's API does.
        checkSize: digits(v.checkSize),
        focus: v.focus,
        viaFund: v.viaFund,
        fundId,
        fundRole: fundId ? fundRole : '',
        dealEmails: v.dealEmails,
      },
      nextFunds,
    );
  };

  const tick = (name: 'angel' | 'viaFund' | 'dealEmails', checked: boolean) =>
    setValue(name, checked, { shouldDirty: true });

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(submit)}
        onKeyDown={(e) => {
          // Production: Enter never submits (it adds a focus keyword instead).
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault();
        }}
      >
        <SectionEditorTitle title="Edit Investor Details" />
        <div className={ef.body}>
          <div className={ef.block}>
            <div className={ef.sectionHeader}>
              <h3>How do you invest (select all that apply)?</h3>
            </div>
            <section>
              <label className={clsx(ef.Label, empty.how && s.needsFillTick)}>
                <Checkbox.Root
                  className={ef.Checkbox}
                  checked={angel}
                  onCheckedChange={(v: boolean) => tick('angel', v)}
                >
                  <Checkbox.Indicator className={ef.Indicator}>
                    <CheckIcon className={ef.Icon} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <div className={ef.col}>
                  <div className={ef.primary}>
                    I angel invest as an accredited investor under{' '}
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated-3"
                      className={ef.link}
                    >
                      SEC rules <ExternalLinkIcon />
                    </a>
                  </div>
                </div>
              </label>

              {angel && (
                <>
                  <div className={clsx(ef.row, empty.stages && s.needsFill)}>
                    <PreferenceMultiSelect
                      name="stages"
                      label="Startup stage(s) you invest in?"
                      placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A…)"
                      options={STAGE_OPTIONS}
                    />
                  </div>
                  <div className={clsx(ef.row, empty.checkSize && s.needsFill)}>
                    <FormCurrencyField
                      name="checkSize"
                      label="Typical Check Size"
                      placeholder="E.g. $250.000"
                      currency="USD"
                      isRequired
                    />
                  </div>
                  <div className={clsx(ef.row, empty.focus && s.needsFill)}>
                    <SkillsTagsInput
                      name="focus"
                      selectLabel="Add Investment Focus"
                      placeholder="Add keywords E.g. AI, Staking, Governance, etc."
                    />
                  </div>
                  <div className={ef.divider} />
                </>
              )}
            </section>

            <section>
              <label className={clsx(ef.Label, empty.how && s.needsFillTick)}>
                <Checkbox.Root
                  className={ef.Checkbox}
                  checked={viaFund}
                  onCheckedChange={(v: boolean) => tick('viaFund', v)}
                >
                  <Checkbox.Indicator className={ef.Indicator}>
                    <CheckIcon className={ef.Icon} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <div className={ef.col}>
                  <div className={ef.primary}>I invest through fund(s).</div>
                </div>
              </label>

              {viaFund && (
                <>
                  {!addingInline && (
                    <>
                      {selectedTeam && (
                        <div className={ef.fundInfoBox}>
                          <div className={ef.fundInfo}>
                            <div className={ef.fundAvatar}>
                              <img src={selectedFund?.logo || FUND_LOGO_FALLBACK} alt={selectedTeam.label} />
                            </div>
                            <div className={ef.fundDetails}>
                              <div className={ef.fundName}>{selectedTeam.label}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={ef.removeButton}
                            onClick={() => setValue('team', null, { shouldDirty: true })}
                            aria-label="Remove team"
                          >
                            <CloseIcon width={16} height={16} />
                          </button>
                        </div>
                      )}
                      <div className={clsx(ef.infoSectionContent, empty.team && s.needsFill)}>
                        <FormSelect
                          name="team"
                          backLabel="Teams"
                          placeholder="Search by org name"
                          label="Search and add an investment fund"
                          options={funds.map(fundOption)}
                          renderOption={({ option, label, description }) => (
                            <div className={ef.teamOption}>
                              <ImageWithFallback
                                width={24}
                                height={24}
                                alt={option.label}
                                className={ef.optImg}
                                fallbackSrc="/icons/camera.svg"
                                src={(option as Option).originalObject?.logo || FUND_LOGO_FALLBACK}
                              />
                              <div>
                                {label}
                                {description}
                              </div>
                            </div>
                          )}
                          onChange={(value) => handleTeamSelect(value as Option | null)}
                          isStickyNoData
                          selectRef={teamSelectRef}
                          notFoundContent={
                            <div className={ef.secondaryLabel}>
                              If you don&apos;t see your team on this list, please{' '}
                              <button
                                type="button"
                                className={ef.link}
                                onClick={() => {
                                  (teamSelectRef.current as { blur?: () => void } | null)?.blur?.();
                                  // The new fund's own fields start empty.
                                  setValue('teamStages', []);
                                  setValue('teamCheckSize', '');
                                  setValue('teamFocus', []);
                                  setValue('teamFundTypes', []);
                                  setAddingInline(true);
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

                  {addingInline && (
                    <AddFundInline
                      empty={{ stages: empty.teamStages, checkSize: empty.teamCheckSize }}
                      onClose={() => {
                        setValue('newTeamName', '');
                        setValue('newTeamWebsite', '');
                        setValue('newTeamRole', '');
                        setAddingInline(false);
                      }}
                    />
                  )}

                  {selectedTeam && !addingInline && (
                    <>
                      <div className={ef.row}>
                        <FormField name="teamRole" placeholder="Enter your role" label="Role" isRequired={isTeamLead} />
                        {!isTeamLead && (
                          <div className={ef.noAccessInfoBox}>
                            <div className={ef.noAccessIcon}>
                              <InfoIconFilled />
                            </div>
                            <div className={ef.noAccessContent}>
                              <p className={ef.noAccessTitle}>You don&apos;t have access to edit team information</p>
                              <p className={ef.noAccessDescription}>
                                Only team leads can update investment details for {selectedTeam.label}.
                              </p>
                              <div className={ef.noAccessActions}>
                                <button type="button" className={ef.contactSupportLink} onClick={onContactSupport}>
                                  Contact Support
                                  <ExternalLinkIconBlue />
                                </button>
                                <span className={ef.noAccessActionText}>to request lead reassignment.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {isTeamLead && (
                        <>
                          <div className={ef.row}>
                            <FormField
                              name="website"
                              placeholder="Enter website"
                              label="Website address"
                              description="Paste a URL (company website, LinkedIn, Notion, X.com, Bluesky, etc.)"
                              isRequired
                            />
                          </div>
                          <div className={clsx(ef.row, empty.teamStages && s.needsFill)}>
                            <PreferenceMultiSelect
                              name="teamStages"
                              label="Startup stage(s) you invest in?"
                              placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A…)"
                              options={STAGE_OPTIONS}
                            />
                          </div>
                          <div className={clsx(ef.row, empty.teamCheckSize && s.needsFill)}>
                            <FormCurrencyField
                              name="teamCheckSize"
                              label="Typical Check Size"
                              placeholder="Select typical check size (E.g. $25k - $50.000k)"
                              currency="USD"
                              isRequired
                            />
                          </div>
                          <div className={ef.row}>
                            <SkillsTagsInput
                              name="teamFocus"
                              selectLabel="Add Investment Focus"
                              placeholder="Add keywords. E.g. AI, Staking, Governance, etc."
                            />
                          </div>
                          <div className={ef.row}>
                            <PreferenceMultiSelect
                              name="teamFundTypes"
                              label="Type of fund(s) you invest in?"
                              placeholder="Select fund types (e.g., Early stage, Late stage, Fund-of-funds)"
                              options={FUND_TYPE_OPTIONS}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
            <div className={ef.divider} />
            {/* The deal part (2026-10-01): the fields above already say what you
                invest in, so the only new question is whether to send deals. */}
            <section>
              <label className={ef.Label}>
                <Checkbox.Root
                  className={ef.Checkbox}
                  checked={dealEmails}
                  onCheckedChange={(v: boolean) => tick('dealEmails', v)}
                >
                  <Checkbox.Indicator className={ef.Indicator}>
                    <CheckIcon className={ef.Icon} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <div className={ef.col}>
                  <div className={ef.primary}>Email me deals that match my investment focus and check size</div>
                </div>
              </label>
            </section>
          </div>
        </div>
        <SectionEditorControls onClose={onClose} />
      </form>
    </FormProvider>
  );
}

/**
 * Production's `AddTeamInlineForm` with `showInvestorFields`, as the investor
 * drawer opens it: its stylesheet and copy, its field order. The two selects
 * and the tags field are the grey-✕ copies (lesson 8), so it is composed here
 * rather than imported; the close button takes the DS `CloseIcon`.
 */
function AddFundInline({ empty, onClose }: { empty: { stages: boolean; checkSize: boolean }; onClose: () => void }) {
  return (
    <div className={clsx(at.container, s.addFundInline)}>
      <div className={at.header}>
        <div>
          <h3 className={at.title}>Add Your Role &amp; Team</h3>
          <p className={at.description}>Enter your team&apos;s details below.</p>
        </div>
        <Button variant="secondary" type="button" className={at.closeButton} onClick={onClose} aria-label="Close">
          <CloseIcon width={16} height={16} />
        </Button>
      </div>
      <div className={at.separator} />
      <div className={at.body}>
        <FormField name="newTeamName" placeholder="Enter team name" label="Team Name" isRequired />
        <FormField
          name="newTeamWebsite"
          placeholder="Enter website"
          label="Website Address"
          description="Paste a URL (LinkedIn, company website, etc.)"
          isRequired
        />
        <FormField name="newTeamRole" placeholder="Enter your role" label="Role" isRequired />
        <div className={clsx(s.addFundField, empty.stages && s.needsFill)}>
          <PreferenceMultiSelect
            name="teamStages"
            label="Startup stage(s) you invest in?"
            placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A...)"
            options={STAGE_OPTIONS}
          />
        </div>
        <div className={clsx(s.addFundField, empty.checkSize && s.needsFill)}>
          <FormCurrencyField
            name="teamCheckSize"
            label="Typical Check Size"
            placeholder="Add check size"
            currency="USD"
            isRequired
          />
        </div>
        <div className={s.addFundField}>
          <SkillsTagsInput
            name="teamFocus"
            selectLabel="Add Investment Focus"
            placeholder="Add keywords. E.g. AI, Staking, Governance, etc."
          />
        </div>
        <div className={s.addFundField}>
          <PreferenceMultiSelect
            name="teamFundTypes"
            label="Type of fund(s) you invest in?"
            placeholder="Select fund types (e.g., Early stage, Late stage, Fund-of-funds)"
            options={FUND_TYPE_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}
