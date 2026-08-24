'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { FormattedMemberExperience, useMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { EditExperienceForm } from '@/components/page/member-details/ExperienceDetails/components/EditExperienceForm';

import { useMemberContactsAccess } from '@/services/access-control/hooks/useMemberContactsAccess';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { HeaderActionBtn } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useParseCv } from '@/services/members/hooks/useParseCv';
import { useApplyCvImport } from '@/services/members/hooks/useApplyCvImport';
import { CvParseError, type CvImportApplyPayload } from '@/services/members/cv-import.service';

import { ExperienceDetailsView } from './components/ExperienceDetailsView';
import {
  experienceKey,
  ExperienceImportPanel,
  ExperienceImportReview,
  formatParsedDates,
  type CvImportControls,
  type ImportSelection,
  type ParsedProfile,
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
   * Offer "fill this section from a CV".
   *
   * Off by default, and the member profile page leaves it off: the flag behind
   * this lives in `services/jobs/constants.ts` and the only host that reads it
   * is `JobProfileDrawer`. A prop rather than a flag read in here keeps this
   * section — which is shared with `/members/[id]` — free of a feature gate it
   * doesn't own.
   */
  enableCvImport?: boolean;
}

export const ExperienceDetails = ({ isLoggedIn, userInfo, member, enableCvImport = false }: Props) => {
  const [view, setView] = useState<ExperienceView>('view');
  const [selectedItem, setSelectedItem] = useState<null | FormattedMemberExperience>(null);

  /** What the document said. Held here, not in the panel: this component owns
   *  which card is open, and the review is a different card from the drop area. */
  const [parsed, setParsed] = useState<ParsedProfile | null>(null);
  /** A file the header control collected, handed to the panel so it meets the
   *  same size and extension rules as one dropped on the box. */
  const [pickedFile, setPickedFile] = useState<File | null>(null);

  const isOwner = userInfo?.uid === member.id;
  const { hasAccess: v2HasMemberContacts } = useMemberContactsAccess();

  const {
    onCvImportOpened,
    onCvImportParseSucceeded,
    onCvImportParseEmpty,
    onCvImportParseFailed,
    onCvImportSaved,
    onCvImportSaveFailed,
    onCvImportCancelled,
  } = useMemberAnalytics();

  const { parse, abort } = useParseCv(member.id);
  const applyImport = useApplyCvImport(member.id);
  const { data: experiences } = useMemberExperience(member.id);

  useMobileNavVisibility(view !== 'view');

  const closeImport = useCallback(() => {
    abort();
    setParsed(null);
    setPickedFile(null);
    setView('view');
  }, [abort]);

  const openAddForm = useCallback(() => {
    abort();
    setParsed(null);
    setPickedFile(null);
    setSelectedItem(null);
    setView('add');
  }, [abort]);

  /**
   * The parse, with the funnel's three outcomes reported around it.
   *
   * Wrapping here rather than firing from inside the panel: the promise already
   * distinguishes all three — resolved with rows, resolved empty, rejected — so
   * the host can report them without the panel knowing what analytics is, and
   * without a second copy of "what counts as empty" living in a component.
   */
  const parseAndReport = useCallback(
    async (file: File) => {
      try {
        const result = await parse(file);
        if (result.experiences.length === 0) {
          onCvImportParseEmpty();
        } else {
          onCvImportParseSucceeded({
            experiences_found: result.experiences.length,
            skills_found: result.skills?.length ?? 0,
            has_role: Boolean(result.role?.trim()),
            has_location: Boolean(result.location?.trim()),
          });
        }
        return result;
      } catch (error) {
        /* A cancel is not a failure and has its own event. Everything else is
           reported by category, so "our parser fell over" and "that file was
           rejected" stay separable in the funnel. */
        if (error instanceof CvParseError && error.category !== 'aborted') {
          onCvImportParseFailed(error.category);
        }
        throw error;
      }
    },
    [parse, onCvImportParseEmpty, onCvImportParseSucceeded, onCvImportParseFailed],
  );

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
            onDoorOpened: () => onCvImportOpened('empty-state'),
            onCancelRead: () => onCvImportCancelled('reading'),
          }
        : undefined,
    [enableCvImport, parseAndReport, abort, openAddForm, onCvImportOpened, onCvImportCancelled],
  );

  /**
   * What is already here, in the shape the duplicate rule reads.
   *
   * Sliced to 'YYYY-MM' because `experienceKey` compares the two sides
   * literally, and these are full ISO timestamps while a parse result is a
   * month. Without the slice nothing would ever match and a re-uploaded CV would
   * append its whole history a second time — which is the failure the rule
   * exists to prevent, so it would fail silently and look like it worked.
   */
  const currentExperiences = useMemo(
    () =>
      /* `Array.isArray`, not `?? []`: this is the only place in the section that
         calls `.map` on the query's data — the rest read `.length` — so it is
         the only place a non-array would throw and take the whole section down
         with it. Which is not hypothetical: the repo's global `useQuery` mock
         resolves every query to an object. */
      (Array.isArray(experiences) ? experiences : []).map((item) => ({
        title: item.title ?? '',
        company: item.company ?? '',
        startDate: (item.startDate ?? '').slice(0, 7),
      })),
    [experiences],
  );

  /* The drawer's own gate expression, so "does this profile have a role" gets
     the same answer here as it does in the footer that blocks applying. */
  const currentRole = ((member?.mainTeam?.role ?? '').trim() || (member?.role ?? '').trim()).trim();

  /* Read off the record, never off `parseMemberLocation` — that returns
     'Unknown' for an empty location, so a string test would say every member
     already has one. */
  const hasLocation = Boolean(member.location?.city || member.location?.country || member.location?.metroArea);

  const currentSkills = useMemo(() => (member.skills ?? []).map((skill) => skill.title), [member.skills]);

  const submitImport = async (selection: ImportSelection) => {
    const payload: CvImportApplyPayload = {
      role: selection.role,
      location: selection.location,
      skills: selection.skills,
      /* `key` is a React key and was never a record field. This is the one place
         a proposal becomes something the server stores. */
      experiences: selection.experiences.map(({ key, ...entry }) => entry),
    };

    /* Rows the person re-ticked after being told they already had them. A high
       number here means the duplicate rule is matching things that are not the
       same job — which is only visible from this side, because the review card
       never learns whether its labelling was right. */
    const alreadyHave = new Set(currentExperiences.map(experienceKey));
    const duplicatesOverridden = selection.experiences.filter((entry) => alreadyHave.has(experienceKey(entry))).length;

    try {
      /* Awaited, and the rejection is re-thrown: it has to reach the review
         card, which is the only place that can report it without throwing away
         the selection. */
      await applyImport.mutateAsync(payload);
    } catch (error) {
      onCvImportSaveFailed({ experiences_selected: selection.experiences.length });
      throw error;
    }

    onCvImportSaved({
      experiences_selected: selection.experiences.length,
      experiences_offered: parsed?.experiences.length ?? 0,
      duplicates_overridden: duplicatesOverridden,
      skills_saved: selection.skills.length,
      filled_role: selection.role !== '',
      filled_location: selection.location !== null,
    });

    closeImport();
  };

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
            onSubmit={submitImport}
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
                onClick={() => {
                  onCvImportCancelled('panel');
                  closeImport();
                }}
              >
                Cancel
              </HeaderActionBtn>
            </DetailsSectionHeader>
            {/* `direct`: this route is reached by pressing something that already
                says "Update from CV", so a landing screen offering an "Upload
                your CV" button would be a button revealing a button. */}
            <ExperienceImportPanel
              entry="direct"
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
