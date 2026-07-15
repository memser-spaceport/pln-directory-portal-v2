'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, SVGProps } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { IdeaFormFields } from '@/components/page/gantry/shared/IdeaFormFields';
import { StageBadge } from '@/components/page/gantry/shared/StageBadge';
import { IdeasSubmitButton } from '@/components/page/gantry/ideas/IdeasSubmitButton';
import { RoadmapCardContent } from './RoadmapCardStatic';
import { PrototypeRoadmapFilters } from './PrototypeRoadmapFilters';
import type { RoadmapColumnStage } from '@/components/page/gantry/roadmap/RoadmapFilters';
import { MobileDrawer } from '@/components/ui/MobileDrawer/MobileDrawer';
import FilterCount from '@/components/ui/filter-count';
import { useIsNarrow } from '@/hooks/useIsNarrow';
import { useRoadmapMobileNav } from '@/components/page/gantry/roadmap/hooks/useRoadmapMobileNav';
import type { SubmitIdeaFormData } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import { hasRichTextContent } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import { CheckIcon, CloseIcon, PlusIcon } from '@/components/icons';
import { DEFAULT_ROADMAP_VISIBLE_COLUMNS, GANTRY_STAGE_LABELS, sortRoadmapColumnStages } from '@/services/gantry/constants';
import type { GantryItem, GantryItemType, GantryStage } from '@/services/gantry/types';

// Production roadmap + submit-button styles — reused so the prototype chrome matches 1:1.
import roadmap from '@/components/page/gantry/roadmap/Roadmap.module.scss';
import ideas from '@/components/page/gantry/ideas/Ideas.module.scss';
// Real submit-modal chrome, reused (read-only) exactly as production SubmitIdeaModal composes it.
import submitIdea from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal.module.scss';
import dealModal from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
// Reused stage-color dots (same source the filter's Stages section uses) so the mobile stage
// switcher stays consistent with the rest of the gantry chrome.
import filterStyles from '@/components/page/gantry/shared/GantryFilters.module.scss';
import {
  mockBoardItems,
  mockCurrentUser,
  mockEmptyGantryForm,
  mockGantryObjectives,
  mockObjectiveOptions,
  mockSavedGantryDraft,
  mockSupportedTypes,
  type MockSavedGantryDraft,
  type MockSaveStatus,
} from './mocks';
import s from './GantrySavedDraftItemPrototype.module.scss';

const STAGE_VALUES: GantryStage[] = ['IDEA', 'BACKLOG', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'DECLINED'];

function toPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function isGantryStage(value: string | undefined): value is GantryStage {
  return !!value && STAGE_VALUES.includes(value as GantryStage);
}

function isGantryItemType(value: string | undefined): value is GantryItemType {
  return !!value && mockSupportedTypes.includes(value as GantryItemType);
}

function getStageFromForm(form: SubmitIdeaFormData): GantryStage {
  return isGantryStage(form.stage?.value) ? form.stage.value : 'IDEA';
}

function getTypeFromForm(form: SubmitIdeaFormData): GantryItemType | null {
  return isGantryItemType(form.type?.value) ? form.type.value : null;
}

function getObjectivesFromForm(form: SubmitIdeaFormData) {
  const selected = new Set((form.objectives ?? []).map((o) => o.value));
  return mockGantryObjectives
    .filter((item) => selected.has(item.uid))
    .map((objective) => ({
      uid: objective.uid,
      order: objective.order,
      title: objective.title,
    }));
}

function hasDraftContent(form: SubmitIdeaFormData): boolean {
  return (
    !!form.title.trim() ||
    hasRichTextContent(form.description) ||
    !!form.tags?.length ||
    !!form.type ||
    !!form.objectives?.length
  );
}

function getFormFingerprint(form: SubmitIdeaFormData): string {
  return [
    form.title,
    form.description,
    form.stage?.value ?? '',
    form.tags?.map((tag) => tag.value).join(',') ?? '',
    form.type?.value ?? '',
    form.objectives?.map((o) => o.value).join(',') ?? '',
  ].join('|');
}

function buildDraftFromForm(form: SubmitIdeaFormData): MockSavedGantryDraft {
  return {
    uid: mockSavedGantryDraft.uid,
    updatedAtLabel: 'just now',
    createdBy: mockCurrentUser,
    form: {
      title: form.title,
      description: form.description,
      stage: form.stage,
      tags: form.tags ?? [],
      type: form.type ?? null,
      objectives: form.objectives ?? [],
    },
  };
}

/** Shape a published form into a GantryItem so it can render through the real RoadmapCardContent. */
function buildItemFromForm(form: SubmitIdeaFormData, uid: string, order: number): GantryItem {
  const stage = getStageFromForm(form);

  return {
    uid,
    title: form.title.trim() || 'Untitled Gantry request',
    description: form.description,
    acceptanceCriteria: null,
    stage,
    focusArea: null,
    objectives: getObjectivesFromForm(form),
    tags: form.tags?.map((tag) => tag.value) ?? [],
    type: getTypeFromForm(form),
    order,
    createdByUid: mockCurrentUser.uid,
    createdBy: mockCurrentUser,
    promotedAt: stage === 'IDEA' || stage === 'BACKLOG' ? null : '2026-06-16T10:30:00.000Z',
    promotedByUid: stage === 'IDEA' || stage === 'BACKLOG' ? null : 'mock-admin-1',
    declinedReason: null,
    externalTrackerUrl: null,
    upvoteCount: 0,
    viewerHasUpvoted: false,
    pinCount: 0,
    viewerHasPinned: false,
    viewerPinNote: null,
    authorImpact: null,
    authorImpactReasoning: null,
    avgImpact: null,
    impactCount: 0,
    impactDistribution: null,
    viewerImpact: null,
    deletedAt: null,
    createdAt: '2026-06-16T10:30:00.000Z',
    updatedAt: '2026-06-16T10:30:00.000Z',
  };
}

function itemMatchesSearch(item: GantryItem, searchText: string): boolean {
  const query = searchText.trim().toLowerCase();
  if (!query) return true;

  const haystack = [
    item.title,
    toPlainText(item.description),
    item.type ?? '',
    ...(item.objectives ?? []).map((o) => o.title),
    ...(item.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

// Prototype board cards are static — no boosting/curation, so these handlers are inert.
const noPinToggle = () => undefined;

// Mirrors the production ArrowUpSmallIcon used in the boost-status indicator.
function ArrowUpSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M6 10V2m0 0L2.5 5.5M6 2L9.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Pencil used both inside the "Resume draft" button and as the draft banner hover affordance.
function ResumeIcon(props?: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden {...props}>
      <path
        d="M11.6 3.4l3 3M4 14h3l7.6-7.6a1.4 1.4 0 0 0 0-2L13.6 3.4a1.4 1.4 0 0 0-2 0L4 11v3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function GantrySavedDraftItemPrototype() {
  const [items, setItems] = useState<GantryItem[]>(mockBoardItems);
  const [draft, setDraft] = useState<MockSavedGantryDraft | null>(mockSavedGantryDraft);
  const [saveStatus, setSaveStatus] = useState<MockSaveStatus>('saved');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<RoadmapColumnStage[]>([...DEFAULT_ROADMAP_VISIBLE_COLUMNS]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  // Render client-only: this prototype reuses interactive production components (react-select,
  // framer-motion) whose markup differs pre-hydration. Gating on mount keeps SSR === first paint.
  const [mounted, setMounted] = useState(false);

  const methods = useForm<SubmitIdeaFormData>({
    defaultValues: draft?.form ?? mockEmptyGantryForm,
    mode: 'onChange',
  });

  const watchedTitle = useWatch({ control: methods.control, name: 'title' }) ?? '';
  const watchedDescription = useWatch({ control: methods.control, name: 'description' }) ?? '';
  const watchedStage = useWatch({ control: methods.control, name: 'stage' });
  const watchedTags = useWatch({ control: methods.control, name: 'tags' });
  const watchedType = useWatch({ control: methods.control, name: 'type' });
  const watchedObjectives = useWatch({ control: methods.control, name: 'objectives' });

  const liveFormValues = useMemo<SubmitIdeaFormData>(
    () => ({
      title: watchedTitle,
      description: watchedDescription,
      stage: watchedStage,
      tags: watchedTags ?? [],
      type: watchedType,
      objectives: watchedObjectives ?? [],
    }),
    [watchedDescription, watchedObjectives, watchedStage, watchedTags, watchedTitle, watchedType],
  );

  const liveFormFingerprint = useMemo(() => getFormFingerprint(liveFormValues), [liveFormValues]);
  const canPublish = liveFormValues.title.trim().length > 0;
  const hasLiveContent = hasDraftContent(liveFormValues);
  const { getValues } = methods;

  useEffect(() => {
    if (!modalOpen) return;

    const currentForm = getValues();

    if (!hasDraftContent(currentForm)) {
      const statusTimer = window.setTimeout(() => setSaveStatus('idle'), 0);
      const timer = window.setTimeout(() => setDraft(null), 450);

      return () => {
        window.clearTimeout(statusTimer);
        window.clearTimeout(timer);
      };
    }

    const statusTimer = window.setTimeout(() => setSaveStatus('saving'), 0);

    const timer = window.setTimeout(() => {
      setDraft(buildDraftFromForm(currentForm));
      setSaveStatus('saved');
    }, 650);

    return () => {
      window.clearTimeout(statusTimer);
      window.clearTimeout(timer);
    };
  }, [getValues, liveFormFingerprint, modalOpen]);

  useEffect(() => setMounted(true), []);

  const isNarrow = useIsNarrow();
  const { effectiveActiveColumn, scrollContainerRef, columnRefs, tabsWrapperRef, handleTabChange } = useRoadmapMobileNav(
    visibleColumns,
    isNarrow,
    mounted,
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (!visibleColumns.includes(item.stage as RoadmapColumnStage)) return false;
        if (selectedTags.length > 0 && !selectedTags.every((tag) => item.tags?.includes(tag))) return false;
        if (selectedTypes.length > 0 && (!item.type || !selectedTypes.includes(item.type))) return false;
        if (selectedObjectives.length > 0 && !item.objectives?.some((o) => selectedObjectives.includes(o.uid))) {
          return false;
        }

        return itemMatchesSearch(item, searchText);
      }),
    [items, searchText, selectedObjectives, selectedTags, selectedTypes, visibleColumns],
  );

  const itemsByStage = useMemo(() => {
    const map = Object.fromEntries(visibleColumns.map((stage) => [stage, [] as GantryItem[]])) as Record<
      RoadmapColumnStage,
      GantryItem[]
    >;

    for (const item of filteredItems) {
      if (visibleColumns.includes(item.stage as RoadmapColumnStage)) {
        map[item.stage as RoadmapColumnStage].push(item);
      }
    }

    return map;
  }, [filteredItems, visibleColumns]);

  const appliedFiltersCount =
    selectedTags.length + selectedTypes.length + selectedObjectives.length + (searchText.trim() ? 1 : 0);

  const draftTitle = draft?.form.title.trim() || 'Untitled Gantry request';

  // Saved-draft banner/chip hidden for now (per request) — the draft is still reachable via the
  // header's "Resume draft" button. Flip to re-enable the above-board banner + mobile chip.
  const showDraftBanner = false;

  // Save badge inside the form: short, precise, from the design system — not an alert.
  const saveBadge =
    saveStatus === 'saving' ? (
      <Badge variant="default" className={s.statusBadge}>
        Saving…
      </Badge>
    ) : hasLiveContent ? (
      <Badge variant="success" className={clsx(s.statusBadge, s.statusSaved)}>
        <CheckIcon className={s.savedIcon} aria-hidden />
        Saved
      </Badge>
    ) : null;

  const openCreateModal = () => {
    methods.reset(draft?.form ?? mockEmptyGantryForm);
    setSaveStatus(draft ? 'saved' : 'idle');
    setModalOpen(true);
  };

  const closeCreateModal = () => {
    setModalOpen(false);
  };

  const clearFilters = () => {
    setVisibleColumns([...DEFAULT_ROADMAP_VISIBLE_COLUMNS]);
    setSelectedTags([]);
    setSelectedTypes([]);
    setSelectedObjectives([]);
    setSearchText('');
  };

  const requestDiscard = () => setConfirmDiscardOpen(true);

  const confirmDiscard = () => {
    setDraft(null);
    setSaveStatus('idle');
    methods.reset(mockEmptyGantryForm);
    setModalOpen(false);
    setConfirmDiscardOpen(false);
  };

  const publishDraft = (form: SubmitIdeaFormData) => {
    const stage = getStageFromForm(form);

    setItems((current) => [buildItemFromForm(form, `mock-published-${current.length + 1}`, current.length + 1), ...current]);
    setDraft(null);
    setSaveStatus('idle');
    setVisibleColumns((current) => {
      if (current.includes(stage as RoadmapColumnStage)) return current;
      return sortRoadmapColumnStages([...current, stage as RoadmapColumnStage]);
    });
    methods.reset(mockEmptyGantryForm);
    setModalOpen(false);
  };

  if (!mounted) {
    return <div className={s.root} />;
  }

  // Mocked boost-status indicator — mirrors production's data-driven badge with static values.
  const boostStatusIndicator = (
    <div className={roadmap.boostStatusWrapper}>
      <div className={roadmap.boostStatus} aria-label="3 of 3 boosts remaining">
        <ArrowUpSmallIcon />
        <span className={roadmap.boostStatusText}>3 of 3 boosts left</span>
        <span className={roadmap.boostDots} aria-hidden>
          <span className={roadmap.boostDot} />
          <span className={roadmap.boostDot} />
          <span className={roadmap.boostDot} />
        </span>
      </div>
    </div>
  );

  const createButton = draft ? (
    <button type="button" className={ideas.submitButton} onClick={openCreateModal}>
      <ResumeIcon className={ideas.submitIcon} />
      Resume draft
    </button>
  ) : (
    <IdeasSubmitButton label="Create Item" onClick={openCreateModal} />
  );

  const draftBanner = draft ? (
    <div className={s.draftBanner}>
      <button type="button" className={s.draftBannerMain} onClick={openCreateModal} aria-label="Resume saved draft">
        {/* Real design-system Badge — same component + shared small-badge size as the save status badges. */}
        <Badge variant="default" className={s.statusBadge}>Draft</Badge>
        <span className={s.draftBannerInfo}>
          <span className={s.draftBannerTitleRow}>
            <span className={s.draftBannerTitle}>{draftTitle}</span>
            <ResumeIcon className={s.draftEditIcon} aria-hidden />
          </span>
          <span className={s.draftBannerMeta}>Edited {draft.updatedAtLabel} · not published yet</span>
        </span>
      </button>
      <div className={s.draftBannerActions}>
        <Button style="border" variant="neutral" size="s" onClick={openCreateModal}>
          Resume
        </Button>
        <Button style="link" variant="error" size="s" onClick={requestDiscard}>
          Discard
        </Button>
      </div>
    </div>
  ) : null;

  // Mobile: a compact one-line chip — tap to resume, × to discard. No separate Resume button
  // (the header's "Resume draft" already covers that), so it stays low-weight in the tall mobile header.
  const draftChip = draft ? (
    <div className={s.draftChip}>
      <button type="button" className={s.draftChipMain} onClick={openCreateModal} aria-label="Resume saved draft">
        {/* Real design-system Badge — same component + shared small-badge size as the desktop banner. */}
        <Badge variant="default" className={s.statusBadge}>Draft</Badge>
        <span className={s.draftChipTitle}>{draftTitle}</span>
      </button>
      <button type="button" className={s.draftChipDiscard} onClick={requestDiscard} aria-label="Discard draft">
        <CloseIcon width={16} height={16} color="#64748b" />
      </button>
    </div>
  ) : null;

  const renderStageCards = (stage: RoadmapColumnStage, emptyClassName: string) =>
    itemsByStage[stage]?.length ? (
      itemsByStage[stage].map((item) => (
        <article key={item.uid} className={roadmap.card}>
          <RoadmapCardContent
            item={item}
            position={item.order ?? undefined}
            canPin={false}
            isPinDisabled={false}
            canCurate={false}
            onPinToggle={noPinToggle}
          />
        </article>
      ))
    ) : (
      <p className={emptyClassName}>No mocked items.</p>
    );

  const filters = (
    <FiltersSidePanel clearParams={clearFilters} appliedFiltersCount={appliedFiltersCount} hideFooter>
      <PrototypeRoadmapFilters
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        selectedTags={selectedTags}
        onSelectedTagsChange={setSelectedTags}
        selectedTypes={selectedTypes}
        onSelectedTypesChange={setSelectedTypes}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        objectives={mockGantryObjectives}
        selectedObjectives={selectedObjectives}
        onSelectedObjectivesChange={setSelectedObjectives}
      />
    </FiltersSidePanel>
  );

  const content = (
    <div className={roadmap.pageLayout}>
      <div className={roadmap.content}>
        <div className={roadmap.pageHeader}>
          <div className={roadmap.titleRow}>
            <div className={roadmap.titleSection}>
              <h1 className={roadmap.title}>Gantry</h1>
              <p className={roadmap.subtitle}>
                Share what the network needs and track it across the roadmap. You can keep one draft at a time.
              </p>
            </div>
            <div className={roadmap.actions}>
              {boostStatusIndicator}
              {createButton}
            </div>
          </div>
        </div>

        {showDraftBanner && draftBanner}

        <div className={roadmap.boardScroll}>
          <div
            className={roadmap.columns}
            style={
              {
                '--roadmap-cols': visibleColumns.length,
                gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(240px, 1fr))`,
              } as CSSProperties
            }
          >
            {visibleColumns.map((stage) => (
              <section key={stage} className={roadmap.column}>
                <div className={roadmap.columnHeader}>
                  <StageBadge stage={stage} className={roadmap.columnHeaderBadge} />
                </div>
                <div className={roadmap.list}>{renderStageCards(stage, roadmap.empty)}</div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const mobileLayout = (
    <div className={roadmap.pageLayout}>
      <div className={roadmap.content}>
        <div className={roadmap.pageHeader}>
          <div className={roadmap.titleRow}>
            <div className={roadmap.titleSection}>
              <div className={roadmap.titleInline}>
                <h1 className={roadmap.title}>Gantry</h1>
                {boostStatusIndicator}
              </div>
              <div className={clsx(roadmap.mobileActionsRow, s.mobileActionsSpacing)}>
                {/* Match the shared mobile Filters trigger (MobileFilterWrapper): white pill +
                    soft shadow, ⊕ plus icon, inline "(N)" count — not gantry's bordered
                    filter-lines button. */}
                <button type="button" className={s.mobileFiltersButton} onClick={() => setFiltersOpen(true)}>
                  <PlusIcon color="#455468" />
                  Filters
                  {appliedFiltersCount > 0 && <span>&nbsp;({appliedFiltersCount})</span>}
                </button>
                {createButton}
              </div>
              <p className={roadmap.subtitle}>
                Share what the network needs and track it across the roadmap. You can keep one draft at a time.
              </p>
            </div>
          </div>
        </div>

        {showDraftBanner && draftChip}

        {visibleColumns.length === 0 ? (
          <p className={roadmap.empty}>Select at least one column to view the roadmap.</p>
        ) : (
          <>
            {/* Mobile stage switcher: clean underline tabs (stage-color dot + label + count)
                instead of a row of filled status-chips — chips read as status/filters, not nav.
                Keeps the hook's DOM contract: the scroll track is firstElementChild and each tab
                is role="tab". */}
            <div ref={tabsWrapperRef} className={clsx(roadmap.mobileTabs, s.stageNav)}>
              <div className={s.stageNavTrack} role="tablist" aria-label="Roadmap stages">
                {visibleColumns.map((stage) => {
                  const isActive = (effectiveActiveColumn ?? visibleColumns[0]) === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={clsx(s.stageNavTab, isActive && s.stageNavTabActive)}
                      onClick={() => handleTabChange(stage)}
                    >
                      <span
                        className={clsx(filterStyles.stageFilterDot, filterStyles[`stageFilterDot_${stage}`])}
                        aria-hidden
                      />
                      <span className={s.stageNavLabel}>{GANTRY_STAGE_LABELS[stage]}</span>
                      <span className={s.stageNavCount}>{itemsByStage[stage]?.length ?? 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div ref={scrollContainerRef} className={roadmap.mobileScrollContainer}>
              {visibleColumns.map((stage) => (
                <div
                  key={stage}
                  data-stage={stage}
                  ref={(el) => {
                    if (el) columnRefs.current.set(stage, el);
                    else columnRefs.current.delete(stage);
                  }}
                  className={roadmap.mobileColumn}
                >
                  {renderStageCards(stage, roadmap.mobileColumnEmpty)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={s.root} style={{ '--app-header-height': '0px' } as CSSProperties}>
      {isNarrow ? mobileLayout : <DashboardPagesLayout filters={filters} content={content} />}

      {isNarrow && (
        <MobileDrawer
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title={
            <>
              Filters
              {appliedFiltersCount > 0 && <FilterCount count={appliedFiltersCount} />}
            </>
          }
        >
          <PrototypeRoadmapFilters
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={setVisibleColumns}
            selectedTags={selectedTags}
            onSelectedTagsChange={setSelectedTags}
            selectedTypes={selectedTypes}
            onSelectedTypesChange={setSelectedTypes}
            searchText={searchText}
            onSearchTextChange={setSearchText}
            objectives={mockGantryObjectives}
            selectedObjectives={selectedObjectives}
            onSelectedObjectivesChange={setSelectedObjectives}
          />
          {/* Common mobile-filter footer — sticky Clear + Apply actions, matching the shared
              MobileFilterWrapper used by Members / Teams / Jobs (gantry was the outlier with a
              header "Clear all" link and no Apply button). */}
          <div className={s.mobileFilterFooter}>
            <Button style="border" variant="neutral" className={s.mobileFilterFooterBtn} onClick={clearFilters}>
              Clear filters
            </Button>
            <Button className={s.mobileFilterFooterBtn} onClick={() => setFiltersOpen(false)}>
              Apply filters
            </Button>
          </div>
        </MobileDrawer>
      )}

      <Modal isOpen={modalOpen} onClose={closeCreateModal} closeOnBackdropClick={false}>
        <div className={clsx(submitIdea.root, s.formModal)}>
          <div className={clsx(dealModal.header, s.formHeader)}>
            <div className={dealModal.headerText}>
              <div className={s.modalTitleRow}>
                <h2 className={dealModal.title}>Create item</h2>
                {saveBadge}
              </div>
              <p className={dealModal.subtitle}>Add an item to the board and choose the stage it should start in.</p>
            </div>
            <button type="button" className={dealModal.closeButton} onClick={closeCreateModal} aria-label="Close">
              <CloseIcon width={20} height={20} color="#0a0c11" />
            </button>
          </div>

          <div className={dealModal.content}>
            <FormProvider {...methods}>
              <IdeaFormFields canSetStageOnCreate />
              <div className={submitIdea.objectiveField}>
                <FormMultiSelect
                  name="objectives"
                  label="Objectives"
                  placeholder="Select objectives..."
                  options={mockObjectiveOptions}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                />
              </div>
            </FormProvider>
          </div>

          <div className={clsx(dealModal.footer, s.formFooter)}>
            <Button style="link" variant="error" onClick={requestDiscard} disabled={!draft && !hasLiveContent}>
              Discard draft
            </Button>
            <div className={dealModal.footerActions}>
              <Button style="border" variant="neutral" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button onClick={methods.handleSubmit(publishDraft)} disabled={!canPublish}>
                Create Item
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirmDiscardOpen} onClose={() => setConfirmDiscardOpen(false)} className={s.confirmContainer}>
        <div className={s.confirmRoot}>
          <h3 className={s.confirmTitle}>Discard draft?</h3>
          <p className={s.confirmText}>
            You&apos;ll lose “{draftTitle}”. This can&apos;t be undone.
          </p>
          <div className={s.confirmActions}>
            <Button style="border" variant="neutral" onClick={() => setConfirmDiscardOpen(false)}>
              Keep draft
            </Button>
            <Button variant="error" onClick={confirmDiscard}>
              Discard draft
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
