'use client';

import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';
import { Checkbox } from '@base-ui-components/react/checkbox';
import type { ITeam } from '@/types/teams.types';
import { Drawer } from '@/components/common/Drawer';
import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { EditButton } from '@/components/common/profile/EditButton';
import { TagsList } from '@/components/common/profile/TagsList';
import { FormCurrencyField } from '@/components/form/FormCurrencyField';
import { FormSelect } from '@/components/form/FormSelect';
// By path, not the folder index — the index also exports the prompt banner,
// which pulls the investor-settings mutation in with it.
import { InvestmentDetailsSection } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components/InvestmentDetailsSection';
import { FundTeamCard } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components/FundTeamCard';
import {
  CheckIcon,
  ExternalLinkIcon,
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
import ef from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/EditInvestorProfileForm.module.scss';
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
 * Demo Day's `EditInvestorProfileDrawer`, for SPV applicants: the same three
 * sections in the same order — the profile header card, Investor Details, and
 * Contact Details — so an investor who has been through Demo Day meets the
 * drawer they already know.
 *
 * Production's drawer lets every section open its own editor with the
 * controls row on top. This one uses the shared section editor the
 * prototypes' member profile settled on (one card open at a time, the rest
 * muted, Cancel/Save after the fields), so the three editors behave like the
 * member page's rather than like three independent forms.
 *
 * Investor Details is copy-simplified from `InvestorProfileDetails`: the view
 * imports production's `InvestmentDetailsSection` and `FundTeamCard` as they
 * are; the form keeps `EditInvestorProfileForm`'s question ("How do you
 * invest?"), its two ticks and the fields each opens. Dropped: the prompt
 * banner (it writes investor settings through the API), and "add a new fund"
 * (production opens the Add Team flow — here the fund list is mocked).
 */

export type InvestorRecord = {
  /** "I angel invest as an accredited investor under SEC rules" */
  angel: boolean;
  stages: string[];
  checkSize: string;
  focus: string[];
  /** "I invest through fund(s)." */
  viaFund: boolean;
  fundId: string | null;
  /** "Email me deals that match" — added 2026-10-01 for SPV Spotlight. */
  dealEmails: boolean;
};

// What the section is for (2026-10-01): the answers decide which deals are sent.
const DEAL_LEAD =
  'Tell us what you invest in and your typical check size. We’ll use it to email you deals that match, so you only see the ones you’d want to look at.';

type Target = 'profile' | 'investor' | 'contact' | null;

const STAGE_OPTIONS = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D and later'].map((v) => ({
  value: v,
  label: v,
}));

// Mocked directory funds — production lists the investor's investment teams.
const FUNDS: ITeam[] = [
  {
    id: 'fund-northfield',
    name: 'Northfield Ventures',
    logo: '',
    investorProfile: {
      investInFundTypes: ['Early stage', 'Web3'],
      typicalCheckSize: '500000',
      investInStartupStages: ['Seed', 'Series A'],
      investmentFocus: ['Infrastructure', 'DeSci', 'AI'],
    },
  },
  {
    id: 'fund-lattice',
    name: 'Lattice Capital',
    logo: '',
    investorProfile: {
      investInFundTypes: ['Multi-stage'],
      typicalCheckSize: '1500000',
      investInStartupStages: ['Series A', 'Series B'],
      investmentFocus: ['Crypto', 'Fintech'],
    },
  },
] as unknown as ITeam[];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileRecord;
  onProfileChange: (next: ProfileRecord) => void;
  investor: InvestorRecord;
  onInvestorChange: (next: InvestorRecord) => void;
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

          {/* 2. Investor Details. */}
          <Section {...sectionProps('investor')}>
            <DetailsSection
              editView={is('investor')}
              classes={{
                ...editSectionClasses(is('investor')),
                root: clsx(ipd.root, editSectionClasses(is('investor'))?.root),
              }}
            >
              {is('investor') ? (
                <InvestorForm
                  investor={investor}
                  onClose={close}
                  onSubmit={(next) => {
                    onInvestorChange(next);
                    close();
                  }}
                />
              ) : (
                <InvestorView investor={investor} onEdit={() => setEditing('investor')} />
              )}
            </DetailsSection>
          </Section>

          {/* 3. Contact Details. */}
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

// Copy-simplified InvestorProfileView: same header, same two blocks, same
// show/hide rules for "through fund(s)" and "Direct Investments".
function InvestorView({ investor, onEdit }: { investor: InvestorRecord; onEdit: () => void }) {
  const fund = investor.viaFund ? FUNDS.find((f) => f.id === investor.fundId) : undefined;
  const showDirect = investor.angel || !investor.viaFund;
  const hasDirect = !!investor.checkSize || investor.stages.length > 0 || investor.focus.length > 0;

  return (
    <div className={iv.root}>
      <DetailsSectionHeader title="Investor Details">
        <EditButton onClick={onEdit} />
      </DetailsSectionHeader>
      {/* What the section is for (2026-10-01): deals sent to the investor's liking. */}
      <p className={s.dealLead}>{DEAL_LEAD}</p>
      <div className={iv.content}>
        {fund && (
          <div className={iv.block}>
            <div className={iv.blockTitle}>Investment through fund(s)</div>
            <FundTeamCard team={fund} isEditable />
          </div>
        )}
        {showDirect && (
          <div className={iv.block}>
            {hasDirect && investor.angel && <div className={iv.blockTitle}>Direct Investments</div>}
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
  );
}

/* ---------- Investor Details: form ---------- */

type InvestorFormValues = {
  angel: boolean;
  stages: { value: string; label: string }[];
  checkSize: string;
  focus: string[];
  viaFund: boolean;
  dealEmails: boolean;
  fund: { value: string; label: string } | null;
};

function InvestorForm({
  investor,
  onClose,
  onSubmit,
}: {
  investor: InvestorRecord;
  onClose: () => void;
  onSubmit: (next: InvestorRecord) => void;
}) {
  const fundOption = (id: string | null) => {
    const f = FUNDS.find((x) => x.id === id);
    return f ? { value: f.id, label: f.name ?? '' } : null;
  };
  const methods = useForm<InvestorFormValues>({
    defaultValues: {
      angel: investor.angel,
      stages: investor.stages.map((v) => ({ value: v, label: v })),
      checkSize: investor.checkSize,
      focus: investor.focus,
      viaFund: investor.viaFund,
      dealEmails: investor.dealEmails,
      fund: fundOption(investor.fundId),
    },
  });
  const { watch, setValue, handleSubmit } = methods;
  const angel = watch('angel');
  const viaFund = watch('viaFund');
  const dealEmails = watch('dealEmails');

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit((v) =>
          onSubmit({
            angel: v.angel,
            stages: v.stages.map((o) => o.value),
            // FormCurrencyField holds its display string ("$250,000"); the
            // record keeps the number, as production's API does.
            checkSize: String(v.checkSize ?? '').replace(/[^0-9.]/g, ''),
            focus: v.focus,
            viaFund: v.viaFund,
            dealEmails: v.dealEmails,
            fundId: v.viaFund ? (v.fund?.value ?? null) : null,
          }),
        )}
      >
        <SectionEditorTitle title="Edit Investor Details" />
        <p className={s.dealLead}>{DEAL_LEAD}</p>
        <div className={ef.body}>
          <div className={ef.block}>
            <div className={ef.sectionHeader}>
              <h3>How do you invest (select all that apply)?</h3>
            </div>
            <section>
              <label className={ef.Label}>
                <Checkbox.Root
                  className={ef.Checkbox}
                  checked={angel}
                  onCheckedChange={(v: boolean) => setValue('angel', v, { shouldDirty: true })}
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
                  <div className={ef.row}>
                    <PreferenceMultiSelect
                      name="stages"
                      label="Startup stage(s) you invest in?"
                      placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A…)"
                      options={STAGE_OPTIONS}
                    />
                  </div>
                  <div className={ef.row}>
                    <FormCurrencyField
                      name="checkSize"
                      label="Typical Check Size"
                      placeholder="E.g. $250.000"
                      currency="USD"
                      isRequired
                    />
                  </div>
                  <div className={ef.row}>
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
              <label className={ef.Label}>
                <Checkbox.Root
                  className={ef.Checkbox}
                  checked={viaFund}
                  onCheckedChange={(v: boolean) => setValue('viaFund', v, { shouldDirty: true })}
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
                <div className={ef.row}>
                  <FormSelect
                    name="fund"
                    label="Fund"
                    placeholder="Search or select your fund"
                    options={FUNDS.map((f) => ({ value: f.id, label: f.name ?? '' }))}
                  />
                </div>
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
                  onCheckedChange={(v: boolean) => setValue('dealEmails', v, { shouldDirty: true })}
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
