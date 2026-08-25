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

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo | null;
  /**
   * Offer "fill this section from a CV" — i.e. **this section is the host**.
   *
   * Off by default, and the member profile page leaves it off: the flag behind
   * this lives in `services/jobs/constants.ts` and the only host that reads it
   * is `JobProfileDrawer`. A prop rather than a flag read in here keeps this
   * section — which is shared with `/members/[id]` — free of a feature gate it
   * doesn't own.
   *
   * It is not only the flag. The drawer turns this **off while it is making the
   * offer itself**, from its own "Start with your CV" card above the header: a
   * CV fills the required role as well as the history, so on a blank profile the
   * offer belongs above the questions it answers. One mechanism, two possible
   * hosts, never both at once — two doors to the same place on one screen is a
   * choice with no consequence. See `pickCvImportHost`, which answers that once
   * so this prop and the card above cannot disagree.
   */
  enableCvImport?: boolean;
}

export const ExperienceDetails = ({ isLoggedIn, userInfo, member, enableCvImport = false }: Props) => {
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

  const cvImport: CvImportControls | undefined = useMemo(
    () =>
      enableCvImport
        ? {
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
            onCancelRead: () => onCvImportCancelled('reading'),
          }
        : undefined,
    [enableCvImport, parseAndReport, abort, openAddForm, setParsed, onCvImportCancelled],
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
