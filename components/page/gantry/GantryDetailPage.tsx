'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/core/ConfirmDialog/ConfirmDialog';
import { BackButton } from '@/components/ui/BackButton/BackButton';
import { EditButton } from '@/components/common/profile/EditButton';
import { HeaderActionBtn } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { QuillContent } from '@/components/ui/QuillContent/QuillContent';
import { hasRichTextContent } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGantryAccess } from '@/services/rbac/hooks/useGantryAccess';
import { useGantryItem } from '@/services/gantry/hooks/useGantryItem';
import { useArchiveGantryItem } from '@/services/gantry/hooks/useArchiveGantryItem';
import { useGantryTransition } from '@/services/gantry/hooks/useGantryTransition';
import { useGantryPin } from '@/services/gantry/hooks/useGantryPin';
import { useGantryPinNote } from '@/services/gantry/hooks/useGantryPinNote';
import { useGantryPinStatus } from '@/services/gantry/hooks/useGantryPinStatus';
import { isPreRoadmapStage } from '@/services/gantry/constants';
import type { GantryStage } from '@/services/gantry/types';
import { useGantryAnalytics } from '@/analytics/gantry.analytics';
import { useRoadmapPinActions } from './roadmap/hooks/useRoadmapPinActions';
import { EditIdeaForm } from './shared/EditIdeaForm';
import { BoostersSection } from './shared/BoostersSection';
import { BoostButton } from './shared/BoostButton';
import { GantryItemAuthor } from './shared/GantryItemAuthor';
import { PinNotePopover } from './shared/PinNotePopover';
import { PinSwapPicker } from './shared/PinSwapPicker';
import { StageSelector } from './shared/StageSelector';
import { BuildWithAgentsButton } from './shared/BuildWithAgentsButton';
import { DeclineIdeaModal } from './shared/DeclineIdeaModal';
import s from './GantryDetailPage.module.scss';

interface Props {
  readonly uid: string;
}

const editableStages: GantryStage[] = ['IDEA', 'BACKLOG'];

export function GantryDetailPage({ uid }: Props) {
  const router = useRouter();
  const analytics = useGantryAnalytics();
  const { currentUser } = useCurrentUserStore();
  const access = useGantryAccess();
  const { data: item, isLoading, isError } = useGantryItem(uid);
  const archiveMutation = useArchiveGantryItem(uid);
  const transitionMutation = useGantryTransition();
  const pin = useGantryPin();
  const pinNote = useGantryPinNote();
  const { data: pinStatus } = useGantryPinStatus(!!currentUser);
  const {
    pinNotePopover,
    setPinNotePopover,
    handlePinToggle,
    handlePinNoteSave,
    swapPickerState,
    handleSwapSelect,
    handleSwapDismiss,
  } = useRoadmapPinActions(pin, pinNote, analytics, pinStatus);
  const isNavigatingAwayRef = useRef(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);

  const handleStageSelect = async (nextStage: GantryStage) => {
    if (!item || nextStage === item.stage) return;

    if (nextStage === 'DECLINED') {
      setIsDeclineModalOpen(true);
      return;
    }

    if (isPreRoadmapStage(item.stage) && nextStage === 'PLANNED') {
      await transitionMutation.mutateAsync({ uid: item.uid, payload: { type: 'promote' } });
      return;
    }

    await transitionMutation.mutateAsync({ uid: item.uid, payload: { type: 'transition', stage: nextStage } });
  };

  if (isLoading) {
    return (
      <div className={s.root}>
        <div className={s.headerContainer}>
          <BackButton to="/gantry/dashboard" className={s.backButton} />
        </div>
        <div className={s.page}>
          <div className={s.card}>
            <div className={s.mainContent}>
              <div className={s.header}>
                <div className={s.skeletonBlock} style={{ width: '70%', height: 42 }} />
                <div className={s.skeletonBlock} style={{ width: '40%', height: 24, marginTop: 12 }} />
                <div className={s.skeletonBlock} style={{ width: '60%', height: 20, marginTop: 12 }} />
              </div>
              <div className={s.content}>
                <div className={s.skeletonBlock} style={{ width: '100%', height: 120 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !item) {
    if (isNavigatingAwayRef.current) {
      return (
        <div className={s.root}>
          <div className={s.headerContainer}>
            <BackButton to="/gantry/dashboard" className={s.backButton} />
          </div>
          <div className={s.page}>
            <div className={s.card}>
              <div className={s.mainContent}>
                <div className={s.header}>
                  <div className={s.skeletonBlock} style={{ width: '70%', height: 42 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={s.root}>
        <div className={s.headerContainer}>
          <BackButton to="/gantry/dashboard" className={s.backButton} />
        </div>
        <div className={s.page}>
          <div className={s.notFound}>
            <h1>Item not found</h1>
            <Link href="/gantry/dashboard" className={s.notFoundLink}>
              Back to Gantry
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canEditOwn =
    !!currentUser?.uid &&
    access.canEditOwn &&
    item.createdByUid === currentUser.uid &&
    editableStages.includes(item.stage as GantryStage);
  const canEdit = canEditOwn || access.canCurate;

  const handleArchiveConfirm = async () => {
    try {
      isNavigatingAwayRef.current = true;
      await archiveMutation.mutateAsync('Archived from detail page');
      setIsArchiveModalOpen(false);
      router.push('/gantry/dashboard');
    } catch {
      isNavigatingAwayRef.current = false;
      // Keep modal open so the user can retry or cancel.
    }
  };

  const handleDeclineConfirm = async (reason: string) => {
    if (!item) return;
    try {
      await transitionMutation.mutateAsync({ uid: item.uid, payload: { type: 'decline', reason } });
      setIsDeclineModalOpen(false);
    } catch {
      // Keep modal open so the user can retry or cancel.
    }
  };

  return (
    <div className={s.root}>
      <div className={s.headerContainer}>
        <BackButton to="/gantry/dashboard" className={s.backButton} />
      </div>

      <div className={s.page}>
        <div className={s.card}>
          <div className={s.mainContent}>
            <div className={s.header}>
              <div className={s.headerTop}>
                <h1 className={s.title}>{item.title}</h1>
                {canEdit && !isEditMode && (
                  <div className={s.itemActions}>
                    <EditButton onClick={() => setIsEditMode(true)} />
                    {access.canCurate && (
                      <HeaderActionBtn
                        onClick={() => setIsArchiveModalOpen(true)}
                        disabled={archiveMutation.isPending}
                        className={s.archiveAction}
                      >
                        <ArchiveIcon />
                        Archive
                      </HeaderActionBtn>
                    )}
                  </div>
                )}
              </div>

              <div className={s.meta}>
                <StageSelector
                  stage={item.stage}
                  canChange={access.canTransition}
                  isPending={transitionMutation.isPending}
                  onStageSelect={handleStageSelect}
                />
                <span className={s.metaDot} aria-hidden />
                <GantryItemAuthor author={item.createdBy} backTo={`/gantry/${item.uid}`} />
                <span className={s.metaDot} aria-hidden />
                <BoostButton
                  count={item.pinCount}
                  hasPinned={item.viewerHasPinned}
                  readonly={item.stage === 'IN_PROGRESS' || item.stage === 'SHIPPED' || item.stage === 'DECLINED'}
                  disabled={!currentUser || pin.isPending}
                  onToggle={(next, el) => handlePinToggle(item.uid, next, el)}
                />
              </div>
              {access.canCurate && item.pinCount > 0 && (
                <div className={s.boostArea}>
                  <BoostersSection item={item} />
                </div>
              )}
            </div>

            {item.tags && item.tags.length > 0 && !isEditMode && (
              <div className={s.tagsRow}>
                <span className={s.tagsLabel}>Tags</span>
                <div className={s.tagsList} aria-label={`Tags: ${item.tags.join(', ')}`}>
                  {item.tags.map((tag) => (
                    <span key={tag} className={s.tagChip}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {item.type && !isEditMode && (
              <div className={s.tagsRow}>
                <span className={s.tagsLabel}>Type of request</span>
                <div className={s.tagsList}>
                  <span className={s.tagChip}>{item.type}</span>
                </div>
              </div>
            )}

            <div className={s.mobileDivider} />

            {isEditMode ? (
              <EditIdeaForm
                key={item.updatedAt}
                item={item}
                onCancel={() => setIsEditMode(false)}
                onSaved={() => setIsEditMode(false)}
              />
            ) : (
              <div className={s.content}>
                {hasRichTextContent(item.description) && (
                  <section className={s.section}>
                    <h2 className={s.sectionTitle}>Description</h2>
                    <QuillContent html={item.description} className={s.richContent} />
                  </section>
                )}
              </div>
            )}

            {!isEditMode && (
              <div className={s.footerExtras}>
                <BuildWithAgentsButton uid={item.uid} onTracked={() => analytics.onBuildButtonClicked(item.uid)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {pinNotePopover && (
        <PinNotePopover
          uid={pinNotePopover.uid}
          pos={{ top: pinNotePopover.top, left: pinNotePopover.left }}
          onSave={handlePinNoteSave}
        />
      )}
      {swapPickerState && (
        <PinSwapPicker
          targetItemTitle={item.title}
          pins={pinStatus?.pins ?? []}
          pos={{ top: swapPickerState.top, left: swapPickerState.left }}
          onSelect={handleSwapSelect}
          onDismiss={handleSwapDismiss}
        />
      )}

      <ConfirmDialog
        isOpen={isArchiveModalOpen}
        title="Archive item?"
        desc={`Are you sure you want to archive "${item.title}"? It will be removed from the board.`}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchiveConfirm}
        confirmTitle={archiveMutation.isPending ? 'Archiving...' : 'Archive'}
        disabled={archiveMutation.isPending}
      />

      <DeclineIdeaModal
        isOpen={isDeclineModalOpen}
        isPending={transitionMutation.isPending}
        onClose={() => setIsDeclineModalOpen(false)}
        onConfirm={handleDeclineConfirm}
      />
    </div>
  );
}

function ArchiveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M11.8125 2.625H9.84375V1.96875C9.84375 1.56264 9.68242 1.17316 9.39526 0.885993C9.10809 0.598828 8.71861 0.4375 8.3125 0.4375H5.6875C5.28139 0.4375 4.89191 0.598828 4.60474 0.885993C4.31758 1.17316 4.15625 1.56264 4.15625 1.96875V2.625H2.1875C2.01345 2.625 1.84653 2.69414 1.72346 2.81721C1.60039 2.94028 1.53125 3.1072 1.53125 3.28125C1.53125 3.4553 1.60039 3.62222 1.72346 3.74529C1.84653 3.86836 2.01345 3.9375 2.1875 3.9375H2.40625V11.375C2.40625 11.6651 2.52148 11.9433 2.7266 12.1484C2.93172 12.3535 3.20992 12.4688 3.5 12.4688H10.5C10.7901 12.4688 11.0683 12.3535 11.2734 12.1484C11.4785 11.9433 11.5938 11.6651 11.5938 11.375V3.9375H11.8125C11.9865 3.9375 12.1535 3.86836 12.2765 3.74529C12.3996 3.62222 12.4688 3.4553 12.4688 3.28125C12.4688 3.1072 12.3996 2.94028 12.2765 2.81721C12.1535 2.69414 11.9865 2.625 11.8125 2.625ZM5.46875 1.96875C5.46875 1.91073 5.4918 1.85509 5.53282 1.81407C5.57384 1.77305 5.62948 1.75 5.6875 1.75H8.3125C8.37052 1.75 8.42616 1.77305 8.46718 1.81407C8.5082 1.85509 8.53125 1.91073 8.53125 1.96875V2.625H5.46875V1.96875ZM10.2812 11.1562H3.71875V3.9375H10.2812V11.1562ZM6.34375 5.6875V9.1875C6.34375 9.36155 6.27461 9.52847 6.15154 9.65154C6.02847 9.77461 5.86155 9.84375 5.6875 9.84375C5.51345 9.84375 5.34653 9.77461 5.22346 9.65154C5.10039 9.52847 5.03125 9.36155 5.03125 9.1875V5.6875C5.03125 5.51345 5.10039 5.34653 5.22346 5.22346C5.34653 5.10039 5.51345 5.03125 5.6875 5.03125C5.86155 5.03125 6.02847 5.10039 6.15154 5.22346C6.27461 5.34653 6.34375 5.51345 6.34375 5.6875ZM8.96875 5.6875V9.1875C8.96875 9.36155 8.89961 9.52847 8.77654 9.65154C8.65347 9.77461 8.48655 9.84375 8.3125 9.84375C8.13845 9.84375 7.97153 9.77461 7.84846 9.65154C7.72539 9.52847 7.65625 9.36155 7.65625 9.1875V5.6875C7.65625 5.51345 7.72539 5.34653 7.84846 5.22346C7.97153 5.10039 8.13845 5.03125 8.3125 5.03125C8.48655 5.03125 8.65347 5.10039 8.77654 5.22346C8.89961 5.34653 8.96875 5.51345 8.96875 5.6875Z"
        fill="currentColor"
      />
    </svg>
  );
}
