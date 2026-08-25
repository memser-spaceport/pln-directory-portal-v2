'use client';

import { useCallback, useMemo, useState } from 'react';

import { useMemberAnalytics } from '@/analytics/members.analytics';
import {
  CvParseError,
  type CvImportApplyPayload,
  type CvImportApplyResult,
} from '@/services/members/cv-import.service';
import type { ResolvedLocation } from '@/services/location.service';
import { useApplyCvImport } from '@/services/members/hooks/useApplyCvImport';
import { useMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { useParseCv } from '@/services/members/hooks/useParseCv';
import { IMember } from '@/types/members.types';

import { experienceKey } from './ExperienceImportReview';
import type { ImportSelection, ParsedProfile } from './types';

/**
 * Everything an import needs that is not "which card is open".
 *
 * Extracted because the importer has **two hosts and one mechanism**. The
 * Experience section owns it while the profile has something in it; the job
 * drawer's "Start with your CV" card owns it while the profile is blank — and a
 * CV fills the required role, the location and the skills as well as the work
 * history, so on a blank profile the offer belongs above the cards it answers
 * rather than four cards down inside one of them.
 *
 * What stays with each host is only the view state: which card is showing, which
 * file the header collected, whether a manual form is open. What moves in here
 * is everything that would otherwise be copied — the parse and its three
 * reported outcomes, the merge payload, the duplicate count, and the four "what
 * does the profile already have" reads the review card is given.
 *
 * A second copy of any of those would be a second definition of a rule that has
 * exactly one correct answer. `duplicatesOverridden` is the sharpest example:
 * `currentExperiences` has to slice ISO timestamps to 'YYYY-MM' before
 * `experienceKey` can match a parse result, and a host that forgot would append
 * a re-uploaded CV's whole history a second time while looking like it worked.
 *
 * Both hosts mounting this at once is fine and expected — `ExperienceDetails` is
 * always on the page. The queries underneath are React Query keys, so the second
 * mount is a cache read, and `parsed` is per-host because only one host is ever
 * *offering* the import (see `importAtTop` in `JobProfileDrawer`).
 */
export function useCvImport(member: IMember) {
  /** What the document said. Held per host, not in the panel: the host owns
   *  which card is open, and the review is a different card from the drop area. */
  const [parsed, setParsed] = useState<ParsedProfile | null>(null);

  const {
    onCvImportParseSucceeded,
    onCvImportParseEmpty,
    onCvImportParseFailed,
    onCvImportSaved,
    onCvImportSaveFailed,
  } = useMemberAnalytics();

  const { parse, abort } = useParseCv(member.id);
  const applyImport = useApplyCvImport(member.id);
  const { data: experiences } = useMemberExperience(member.id);

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
      /* `Array.isArray`, not `?? []`: this is the only place that calls `.map`
         on the query's data — the hosts read `.length` — so it is the only place
         a non-array would throw and take the whole card down with it. Which is
         not hypothetical: the repo's global `useQuery` mock resolves every query
         to an object. */
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

  /**
   * The one place a proposal becomes something the server stores.
   *
   * Deliberately does **not** close the host's card: it rethrows on failure, and
   * the caller closing on the line after the `await` is what keeps a failed save
   * on screen with the selection intact. A host that closed regardless would
   * throw away the review the person just filled in.
   */
  const submitImport = useCallback(
    async (selection: ImportSelection) => {
      if (!parsed) {
        /* Unreachable through the UI — the review only renders on a parse — but
           the endpoint keys the whole write on this uid, so an empty string
           would be a 409 dressed up as a bug report. */
        throw new Error('Cannot apply a CV import without a parse');
      }

      const payload: CvImportApplyPayload = {
        importUid: parsed.importUid,
        role: selection.role,
        /* The wire takes a PLACE AS TEXT and geocodes it server-side; the review
           card resolves one only so the person picks a real place rather than
           typing a guess. So the structure is flattened back to a string here,
           and `''` keeps its meaning of "don't touch". */
        location: formatSelectedLocation(selection.location),
        skills: selection.skills,
        /* `key` is a React key and was never a record field. */
        experiences: selection.experiences.map(({ key, ...entry }) => entry),
      };

      /* Rows the person re-ticked after being told they already had them. A high
         number here means the duplicate rule is matching things that are not the
         same job — which is only visible from this side, because the review card
         never learns whether its labelling was right. */
      const alreadyHave = new Set(currentExperiences.map(experienceKey));
      const duplicatesOverridden = selection.experiences.filter((entry) =>
        alreadyHave.has(experienceKey(entry)),
      ).length;

      let result: CvImportApplyResult | undefined;
      try {
        /* Awaited, and the rejection is re-thrown: it has to reach the review
           card, which is the only place that can report it without throwing away
           the selection. */
        result = await applyImport.mutateAsync(payload);
      } catch (error) {
        onCvImportSaveFailed({ experiences_selected: selection.experiences.length });
        throw error;
      }

      /* Read defensively, and the reason is not paranoia about the schema — the
         response is zod-validated server-side. It is that everything below this
         line runs AFTER a write that already succeeded. A `.length` on an
         unexpected shape would throw here, the review card would report a
         failure the person could only respond to by saving again, and the
         second save would 409 on a now-stale import. Losing an analytics field
         is the cheaper failure by a wide margin. */
      onCvImportSaved({
        experiences_selected: selection.experiences.length,
        experiences_offered: parsed.experiences.length,
        duplicates_overridden: duplicatesOverridden,
        /* What the server ACTUALLY did, not what was asked. It unions skills
           against the catalogue and fills a field only when the member's own is
           blank, so the request is a proposal here too — reporting the request
           would quietly inflate every one of these. `locationApplied` is the
           sharpest case: a place it cannot geocode is skipped silently. */
        skills_saved: Array.isArray(result?.skillsAdded) ? result.skillsAdded.length : 0,
        filled_role: Boolean(result?.role?.trim()) && currentRole === '',
        filled_location: result?.locationApplied === true,
      });
    },
    [applyImport, currentExperiences, currentRole, parsed, onCvImportSaved, onCvImportSaveFailed],
  );

  return {
    parsed,
    setParsed,
    parseAndReport,
    abort,
    submitImport,
    /** The four "what does the profile already have" reads the review is given. */
    currentExperiences,
    currentRole,
    hasLocation,
    currentSkills,
  };
}

/**
 * A picked place, as the text the apply endpoint geocodes.
 *
 * Most specific first, because that is what a geocoder disambiguates on and it
 * is also how the profile card writes a location out. `metroArea` sits between
 * city and country rather than replacing either: for the places that have one
 * it is the part that makes "Cambridge" unambiguous.
 *
 * `null` in, `''` out — the review card's "nothing picked", which the server
 * reads as "leave the member's location alone".
 */
function formatSelectedLocation(location: ResolvedLocation | null): string {
  if (!location) return '';
  return [location.city, location.metroArea, location.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}
