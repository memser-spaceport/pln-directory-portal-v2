'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { IJobTeam } from '@/types/jobs.types';
import { seniorityDisplayLabel, workplaceTypeDisplayLabel } from '@/utils/jobs.utils';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import type { Option } from '@/components/form/FormSelect/types';
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { useFormDraft } from '@/hooks/useFormDraft';
import { DraftSaveStatus } from '@/components/page/gantry/ideas/SubmitIdeaModal/DraftSaveStatus';
import { DiscardDraftDialog } from '@/components/page/gantry/ideas/DiscardDraftDialog';
import { hasRichTextContent } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';

// The product's "submit something for review" modal — Submit a Deal's own
// chrome (600px card, header with subtitle, scrolling content, Cancel / Submit
// footer), plus the idea modal's title row and discard link, which is the same
// composition `team-profile/PostNewsModal` uses. Nothing here is a new shell.
import dealModalStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import ideaModalStyles from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal.module.scss';

import { MOCK_ROLE_CATEGORY_FACETS } from './mocks';
import local from './SubmitJobModal.module.scss';

/** What the form hands back: a role's fields, plus which team it is for. */
export interface SubmittedJob {
  teamUid: string;
  roleTitle: string;
  roleCategory: string;
  seniority: string;
  workMode: string;
  location: string[];
  applyUrl: string | null;
  descriptionHtml: string;
}

interface SubmitJobFormData {
  /** Only asked when `teams` holds more than one. */
  team: Option | null;
  roleTitle: string;
  roleCategory: Option | null;
  seniority: Option | null;
  workMode: Option | null;
  location: string;
  applyUrl: string;
  description: string;
}

/** Same cap the deal form puts on its one-line title. */
const TITLE_MAX = 100;
/**
 * A job description, not a deal blurb. The deal form caps its two rich fields at
 * 600 because a perk is a paragraph; production's ingested bodies run to a few
 * thousand characters, and this is the field that becomes the drawer's step 1.
 */
const DESCRIPTION_MAX = 4000;

/* The rail's own vocabularies, so a submitted job is findable by the filters the
   moment it is live: the category list is the rail's facet list, seniority and
   work mode are the wire values `roleMatches` compares against, labelled the way
   the rail labels them. A free-text category would be a role no filter finds. */
const CATEGORY_OPTIONS: Option[] = MOCK_ROLE_CATEGORY_FACETS.map((f) => ({ label: f.value, value: f.value }));
const SENIORITY_OPTIONS: Option[] = ['Junior (L1-L2)', 'Mid (L3)', 'Senior (L4)', 'Lead (L5)', 'Principal+ (L6-L7)'].map(
  (v) => ({ label: seniorityDisplayLabel(v), value: v }),
);
const WORK_MODE_OPTIONS: Option[] = ['remote', 'hybrid', 'in-office'].map((v) => ({
  label: workplaceTypeDisplayLabel(v),
  value: v,
}));

const stripHtml = (html: string | undefined | null): string =>
  (html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

const isHttpUrl = (value: string): boolean => /^https?:\/\/\S+\.\S+/i.test(value.trim());

const requiredOption = () =>
  yup
    .mixed<Option>()
    .nullable()
    .test('picked', 'Required', (v) => Boolean(v && v.value));

/* Deal-form validation, field for field where the fields match: yup, `mode:
   'onChange'`, the submit button dead until the schema passes. The rich body is
   checked with the tags stripped, exactly as `submitDealSchema` does it. */
const schemaFor = (askTeam: boolean) =>
  yup.object({
    team: askTeam ? requiredOption() : yup.mixed<Option>().nullable(),
    roleTitle: yup.string().trim().required('Required').max(TITLE_MAX, `Max. ${TITLE_MAX} characters.`),
    roleCategory: requiredOption(),
    seniority: requiredOption(),
    workMode: requiredOption(),
    location: yup.string().trim().required('Required'),
    applyUrl: yup
      .string()
      .trim()
      .test('url', 'Enter the full link, starting with https://', (v) => !v || isHttpUrl(v)),
    description: yup
      .string()
      .test('not-empty-html', 'Required', (v) => hasRichTextContent(v))
      .test('max-length', `Max. ${DESCRIPTION_MAX} characters.`, (v) => stripHtml(v).length <= DESCRIPTION_MAX),
  });

const getDefaults = (): SubmitJobFormData => ({
  team: null,
  roleTitle: '',
  roleCategory: null,
  seniority: null,
  workMode: null,
  location: '',
  applyUrl: '',
  description: '',
});

/**
 * The filled form the design canvas photographs — one listing, the way a lead
 * would actually type it. Category, seniority and work mode are picked from the
 * lists above so the frame shows the selects holding answers, not the values
 * typed round them.
 */
const FILLED: SubmitJobFormData = {
  team: null,
  roleTitle: 'Developer Relations Engineer',
  roleCategory: CATEGORY_OPTIONS.find((o) => o.value === 'Engineering') ?? null,
  seniority: SENIORITY_OPTIONS.find((o) => o.value === 'Senior (L4)') ?? null,
  workMode: WORK_MODE_OPTIONS.find((o) => o.value === 'remote') ?? null,
  location: 'Remote',
  applyUrl: '',
  description:
    '<p>Filecoin Foundation is hiring a Developer Relations Engineer to be the technical face of the ecosystem for the teams building on it — the person who answers the hard integration question in the forum, writes the guide that stops it being asked again, and brings what builders are stuck on back to the protocol teams.</p><ul><li>Own the developer docs and the example repos, and keep both runnable.</li><li>Run technical office hours and the builder calls.</li><li>Ship reference integrations for the storage and retrieval APIs.</li></ul>',
};

const isDraftEmpty = (draft: SubmitJobFormData) =>
  !draft.roleTitle.trim() &&
  !draft.location.trim() &&
  !draft.applyUrl.trim() &&
  !hasRichTextContent(draft.description) &&
  !draft.roleCategory &&
  !draft.seniority &&
  !draft.workMode &&
  !draft.team;

interface Props {
  open: boolean;
  onClose: () => void;
  /**
   * The teams this person may post for. One for a lead — the team they lead —
   * and it is never asked, only named; more than one and the form opens with a
   * team select. An admin is passed every team.
   */
  teams: IJobTeam[];
  onSubmit: (job: SubmittedJob) => void;
  /** DELETE WITH: the `design-canvas/` folder. Opens the form already filled in. */
  canvasFilled?: boolean;
}

/**
 * **Submit a job** — the form a team lead or admin fills in to put a listing on
 * the board, modelled on Submit a Deal beat for beat: a page-level door in the
 * toolbar, this modal, a `Submit for review` press, and a listing that is not
 * live until the PL team has looked at it.
 *
 * **The fields are the row and the drawer, nothing else.** Every input here is a
 * field on `IJobRole` — the record the board renders — in the order a reader
 * meets it: the title, then the three facts the row's meta line shows
 * (category · seniority · location, plus the work mode the drawer adds), then
 * the description that becomes step 1 of the apply flow, then the team's own
 * posting link, which the drawer shows as `Original posting`. The deal form's
 * "how to reach out to you" is deliberately absent: a lead is a signed-in
 * member and the PL team can already reach them through the directory, so the
 * question would be asking for something the product has.
 *
 * **Category, seniority and work mode are picked, not typed**, from the filter
 * rail's own lists. A listing exists to be found, and a category spelled
 * differently from the rail's is a role no filter surfaces.
 *
 * **The link is optional, and last.** On production's board today every role is
 * a link out to the team's careers page, because the board has no way to take
 * an application itself. This board does — Apply in the drawer sends the
 * member's profile to the hiring team — so a team with no careers page can
 * list here and still be applied to. The link is for teams that have one.
 *
 * **Location is free text.** Production would use `LocationSelect`, the
 * places-backed picker the profile uses; it is API-bound, so a mock cannot
 * mount it. What the field promises — a city and country, or Remote — is what
 * that picker would produce.
 *
 * **Drafts, the product's way.** `useFormDraft` (production's own hook, the one
 * Gantry's idea modal and the AI-apps feedback dialog use), a Saving… / Saved
 * mark in the title row, the backdrop inert while open, and an explicit
 * Discard step — Cancel and Escape keep the draft. A job description is the
 * longest thing anyone types on this board, and a stray click must not eat it.
 */
export function SubmitJobModal({ open, onClose, teams, onSubmit, canvasFilled }: Props) {
  const askTeam = teams.length > 1;
  const soleTeam = teams.length === 1 ? teams[0] : null;

  const [discardOpen, setDiscardOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimer = useRef<number | null>(null);
  /* react-select menus are portalled out of the modal's scrolling body — the
     card clips overflow, and a menu opened near its bottom edge would otherwise
     be cut off or scroll the form under itself. `FormSelect` lifts a portalled
     menu to z-index 10000, above `Modal`'s 9999. Read after mount, because
     there is no `document` on the server. */
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setPortalTarget(document.body), []);

  const teamOptions = useMemo<Option[]>(() => teams.map((t) => ({ label: t.name, value: t.uid })), [teams]);

  const methods = useForm<SubmitJobFormData>({
    defaultValues: getDefaults(),
    resolver: yupResolver(schemaFor(askTeam)) as unknown as Resolver<SubmitJobFormData>,
    mode: 'onChange',
  });
  const {
    handleSubmit,
    reset,
    control,
    formState: { isValid },
  } = methods;

  const values = useWatch({ control }) as SubmitJobFormData;
  const hasDraft = !isDraftEmpty({ ...getDefaults(), ...values });

  const { clearDraft } = useFormDraft<SubmitJobFormData, SubmitJobFormData>({
    /* Keyed by team, so a lead of two teams does not open one team's half-written
       listing under the other's name. */
    storageKey: `job-board:submit-job:${soleTeam?.uid ?? 'any-team'}`,
    enabled: open && !canvasFilled,
    methods,
    getDefaults,
    toDraft: (form) => form,
    fromDraft: (draft) => ({ ...getDefaults(), ...draft }),
    isEmpty: isDraftEmpty,
    onRestore: (draft) => setSaveStatus(draft ? 'saved' : 'idle'),
  });

  /* DELETE WITH: the `design-canvas/` folder. */
  useEffect(() => {
    if (open && canvasFilled) reset(FILLED);
  }, [open, canvasFilled, reset]);

  // Mirrors the hook's own debounce so the mark flips when the write lands.
  const skipFirst = useRef(true);
  useEffect(() => {
    if (!open) {
      skipFirst.current = true;
      return;
    }
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (!hasDraft) {
      setSaveStatus('idle');
      return;
    }
    setSaveStatus('saving');
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaveStatus('saved'), 500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, values.roleTitle, values.location, values.applyUrl, values.description, values.roleCategory, values.seniority, values.workMode, values.team]);

  const finish = () => {
    clearDraft();
    reset(getDefaults());
    setSaveStatus('idle');
  };

  const handleDiscard = () => {
    finish();
    setDiscardOpen(false);
    onClose();
  };

  const submit = handleSubmit((data) => {
    const teamUid = askTeam ? data.team!.value : soleTeam!.uid;
    onSubmit({
      teamUid,
      roleTitle: data.roleTitle.trim(),
      roleCategory: data.roleCategory!.value,
      seniority: data.seniority!.value,
      workMode: data.workMode!.value,
      /* "Berlin, Germany" is one place; "Berlin, Germany; Remote" is two. The
         semicolon is the separator because the comma is inside the place. */
      location: data.location
        .split(';')
        .map((l) => l.trim())
        .filter(Boolean),
      applyUrl: data.applyUrl.trim() || null,
      descriptionHtml: data.description,
    });
    finish();
    onClose();
  });

  return (
    <>
      <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false}>
        <div className={dealModalStyles.root}>
          <div className={dealModalStyles.header}>
            <div className={dealModalStyles.headerText}>
              <div className={ideaModalStyles.titleRow}>
                <h2 className={dealModalStyles.title}>Submit a job</h2>
                <DraftSaveStatus status={saveStatus} />
              </div>
              {/* The two things the form cannot show: under whose name it goes
                  up, and that it does not go up yet. Deal's own sentence,
                  re-pointed at the board. */}
              <p className={dealModalStyles.subtitle}>
                {soleTeam ? `Posted as ${soleTeam.name}. ` : ''}The PL team reviews every listing before it goes
                live on the board.
              </p>
            </div>
            <button type="button" className={dealModalStyles.closeButton} onClick={onClose} aria-label="Close">
              <CloseIcon width={20} height={20} color="#0a0c11" />
            </button>
          </div>

          <div className={dealModalStyles.content}>
            <FormProvider {...methods}>
              <div className={dealModalStyles.form}>
                {askTeam && (
                  <FormSelect
                    name="team"
                    label="Team"
                    placeholder="Select a team"
                    options={teamOptions}
                    isRequired
                    menuPortalTarget={portalTarget}
                  />
                )}

                <FormField
                  name="roleTitle"
                  label="Role title"
                  placeholder="e.g. Senior Protocol Engineer"
                  isRequired
                  max={TITLE_MAX}
                  maxLength={TITLE_MAX}
                />

                <div className={local.pair}>
                  <FormSelect
                    name="roleCategory"
                    label="Category"
                    placeholder="Select"
                    options={CATEGORY_OPTIONS}
                    isRequired
                    menuPortalTarget={portalTarget}
                  />
                  <FormSelect
                    name="seniority"
                    label="Seniority"
                    placeholder="Select"
                    options={SENIORITY_OPTIONS}
                    isRequired
                    menuPortalTarget={portalTarget}
                  />
                </div>

                <div className={local.pair}>
                  <FormSelect
                    name="workMode"
                    label="Work mode"
                    placeholder="Select"
                    options={WORK_MODE_OPTIONS}
                    isRequired
                    menuPortalTarget={portalTarget}
                  />
                  <FormField
                    name="location"
                    label="Location"
                    placeholder="City, Country — or Remote"
                    isRequired
                    description="Several? Separate them with a semicolon."
                  />
                </div>

                <FormEditor
                  name="description"
                  label="Description"
                  placeholder={
                    'What the role is, what they will do, and what you are looking for.\nCompensation and process if you can share them.'
                  }
                  description={`Shown as the job page on the board. Max. ${DESCRIPTION_MAX} characters.`}
                  isRequired
                  simplified
                  /* No @-mentions: the deal form has them for naming vendors and
                     members, and they call the members search. A job description
                     names nobody. */
                  enableMentions={false}
                  minHeight={180}
                  maxLength={DESCRIPTION_MAX}
                  showCharCount
                />

                <FormField
                  name="applyUrl"
                  label="Link to your own posting (optional)"
                  placeholder="https://"
                  inputMode="url"
                  description="Members can apply here either way. If you have a careers page, the board links to it too."
                />
              </div>
            </FormProvider>
          </div>

          <div className={dealModalStyles.footer}>
            {hasDraft && (
              <button type="button" className={ideaModalStyles.discardDraftLink} onClick={() => setDiscardOpen(true)}>
                Discard draft
              </button>
            )}
            <Button style="border" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            {/* Deal's own label. Sentence case, like every button this board's
                newer surfaces wear. */}
            <Button onClick={submit} disabled={!isValid}>
              Submit for review
            </Button>
          </div>
        </div>
      </Modal>

      <DiscardDraftDialog
        isOpen={discardOpen}
        draftTitle={values.roleTitle?.trim() || 'this listing'}
        onKeep={() => setDiscardOpen(false)}
        onDiscard={handleDiscard}
      />
    </>
  );
}
