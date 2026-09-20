'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { FormattedMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { EditExperienceForm } from '@/components/page/member-details/ExperienceDetails/components/EditExperienceForm';

import { useMemberContactsAccess } from '@/services/access-control/hooks/useMemberContactsAccess';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { HeaderActionBtn } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { useMemberAnalytics } from '@/analytics/members.analytics';

import { ExperienceDetailsView } from './components/ExperienceDetailsView';
/* The view's header-control tone, worn by the import card's Cancel for the same
   reason the header's "Update from CV" wears it: a quiet text control in a slot
   that belongs to `AddButton`'s blue. Same slot, same grammar, so the same
   class rather than a second copy of two colour rules. */
import v from './components/ExperienceDetailsView/ExperienceDetailsView.module.scss';
import {
  ExperienceImportPanel,
  ExperienceImportReview,
  formatParsedDates,
  useCvImport,
  type CvImportControls,
} from './components/ExperienceImport';

import { ViewType } from '@/types/ui';

/**
 * A fourth view, local to this section.
 *
 * `ViewType` in `@/types/ui` is shared by every profile section, none of which
 * can be imported into — widening it there would offer a state to a dozen
 * components that have no way to reach it and no branch for it.
 */
type ExperienceView = ViewType | 'import';

/** See `Props.cvImportSurface`. */
export type CvImportSurface = 'off' | 'header-only' | 'full';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo | null;
  /**
   * How much of the CV importer this section hosts.
   *
   * - `'off'` — none of it, and the default. A prop rather than a flag read in
   *   here keeps this section free of a feature gate it doesn't own.
   * - `'full'` — both affordances: the drop area in the empty row, and "Update
   *   from CV" in the header once entries exist. The apply drawer's Experience
   *   host.
   * - `'header-only'` — the header control alone. What `/members/[id]` passes,
   *   because `MemberCvSection` sits above this section carrying a permanent
   *   drop area of its own, and a second box to drop a file into on the same
   *   page is a choice nobody can get right or wrong.
   *
   * One value rather than two booleans, for the reason `pickCvImportHost`
   * returns a host instead of a pair: two independent expressions of "who is
   * offering this" is exactly how both doors end up open.
   *
   * Note the drawer turns this **off entirely while it is making the offer
   * itself**, from its own "Start with your CV" card above the header — and
   * again once a CV is stored. Both are `pickCvImportHost`'s answer, not this
   * section's: the host that knows decides, and this section renders it.
   */
  cvImportSurface?: CvImportSurface;
}

export const ExperienceDetails = ({ isLoggedIn, userInfo, member, cvImportSurface = 'off' }: Props) => {
  const [view, setView] = useState<ExperienceView>('view');
  const [selectedItem, setSelectedItem] = useState<null | FormattedMemberExperience>(null);

  /** A file the header control collected, handed to the panel so it meets the
   *  same size and extension rules as one dropped on the box. */
  const [pickedFile, setPickedFile] = useState<File | null>(null);

  const isOwner = userInfo?.uid === member.id;
  const { hasAccess: v2HasMemberContacts } = useMemberContactsAccess();

  const { onCvImportCancelled } = useMemberAnalytics();

  /* The mechanism; this component owns only which card is showing. Shared with
     the drawer's "Start with your CV" card — see `useCvImport`. */
  const {
    parsed,
    setParsed,
    parseAndReport,
    abort,
    submitImport,
    currentExperiences,
    currentRole,
    hasLocation,
    currentSkills,
  } = useCvImport(member);

  useMobileNavVisibility(view !== 'view');

  const closeImport = useCallback(() => {
    abort();
    setParsed(null);
    setPickedFile(null);
    setView('view');
  }, [abort, setParsed]);

  const openAddForm = useCallback(() => {
    abort();
    setParsed(null);
    setPickedFile(null);
    setSelectedItem(null);
    setView('add');
  }, [abort, setParsed]);

  /* No stored-CV read of its own any more.
     It had one, to stand this section's offer down while the resting "Your CV"
     card was up. Both hosts now answer that above: the drawer through
     `pickCvImportHost`, which returns `'stored'` and passes `'off'`; the profile
     page through `'header-only'`, where the question doesn't arise because the
     CV section owns the drop area in every state. A second opinion here would be
     a second condition that can drift from the one that decided. */
  const cvImport: CvImportControls | undefined = useMemo(
    () =>
      cvImportSurface !== 'off'
        ? {
            hostsEmptyRow: cvImportSurface === 'full',
            onParse: parseAndReport,
            onAbort: abort,
            onParsed: (result) => {
              setParsed(result);
              setView('import');
            },
            onAddManually: openAddForm,
            onPickFile: (file) => {
              setPickedFile(file);
              setView('import');
            },
            onCancelRead: () => {
              onCvImportCancelled('reading');
              /* The header's "Update from CV" opened this card for a refresh.
                 Cancel has to leave it, not drop back to the drop area with the
                 same file still in `pickedFile` — that identity is what the
                 dropzone keys its auto-start on, so the read would begin again
                 and Cancel would look like it did nothing. The empty-row panel
                 is already on `view`, so this is a no-op there. */
              closeImport();
            },
          }
        : undefined,
    [cvImportSurface, parseAndReport, abort, openAddForm, setParsed, onCvImportCancelled, closeImport],
  );

  if (!isLoggedIn || (!v2HasMemberContacts && !isOwner)) {
    return null;
  }

  return (
    <DetailsSection editView={view !== 'view'}>
      {view === 'view' && (
        <ExperienceDetailsView
          member={member}
          setView={setView}
          userInfo={userInfo!}
          setSelectedItem={setSelectedItem}
          cvImport={cvImport}
        />
      )}
      {view === 'edit' && (
        <EditExperienceForm onClose={() => setView('view')} member={member} initialData={selectedItem} />
      )}
      {view === 'add' && <EditExperienceForm onClose={() => setView('view')} member={member} />}
      {view === 'import' &&
        cvImport &&
        (parsed ? (
          <ExperienceImportReview
            parsed={parsed}
            currentRole={currentRole}
            hasLocation={hasLocation}
            currentSkills={currentSkills}
            currentExperiences={currentExperiences}
            formatDates={formatParsedDates}
            onClose={() => {
              onCvImportCancelled('review');
              closeImport();
            }}
            /* Closing on the line *after* the await, not inside `submitImport`:
               a rejected save has to leave this card open with the selection
               intact so the review can report it. */
            onSubmit={async (selection) => {
              await submitImport(selection);
              closeImport();
            }}
          />
        ) : (
          <>
            {/* Leaving the importer is the *card's* action, so it goes in the
                header's right-hand slot where Add and Edit go on every section,
                rather than under the title as a stray line. Without it this
                route is a dead end: the panel's own "← Back" is absent in
                `direct` mode, so the only way out would be closing the drawer. */}
            <DetailsSectionHeader title="Add experience from a document">
              <HeaderActionBtn
                className={v.quietHeaderAction}
                onClick={() => {
                  onCvImportCancelled('panel');
                  closeImport();
                }}
              >
                Cancel
              </HeaderActionBtn>
            </DetailsSectionHeader>
            <ExperienceImportPanel
              initialFile={pickedFile}
              privacyNote="We read the file to fill in your experience. It isn't sent with your applications."
              onParse={cvImport.onParse}
              onAbort={cvImport.onAbort}
              onParsed={cvImport.onParsed}
              onAddManually={cvImport.onAddManually}
              onCancelRead={cvImport.onCancelRead}
            />
          </>
        ))}
    </DetailsSection>
  );
};
