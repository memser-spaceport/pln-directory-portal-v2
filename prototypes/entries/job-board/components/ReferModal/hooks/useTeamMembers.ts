'use client';

import { useMemo } from 'react';

import { MOCK_HIRING_TEAMS } from '../../../mocks';
import { DirectoryMember } from '../types';

/**
 * The hiring team: the people an application is read by, and the ones a referral
 * is addressed to.
 *
 * **This used to make two real API calls** — `searchTeamsByName` to turn the
 * board's team name into a directory uid, then `getMembersForProjectForm` for
 * its members — wrapped in react-query. It was the one place in this entry
 * reaching `services/`, and `prototypes/CLAUDE.md` §2 forbids exactly that:
 * mocked data only, no real API calls, no react-query, no services.
 *
 * The rule earned itself here rather than being enforced on principle.
 * `DIRECTORY_API_URL` is inlined at build time by `next.config.mjs`, and the
 * `pln-prototypes` deployment doesn't set it — so on the shared link the fetch
 * resolved to `/prototypes/undefined/v1/teams?name__icontains=…` and 404'd every
 * time. Both consumers render nothing when the lookup comes back empty (a name
 * that isn't there yet is worse than no name), so the facepile and the prefilled
 * recipients were invisible to every reviewer opening the link — the only
 * audience the link has. Locally it worked or didn't depending on whether the
 * API was reachable, which is worse than either: a prototype that renders
 * differently run to run cannot be reviewed.
 *
 * So the team comes from `MOCK_HIRING_TEAMS` now, and the two surfaces still
 * read one source — the invariant that mattered was never "live", it was that
 * the apply pane and the refer modal name the same people.
 *
 * **Still live in the refer modal:** `useMemberSearch`, the type-a-name lookup
 * over the whole directory. Same defect, different mechanism and a different
 * surface — a fixed cast of mock teammates cannot stand in for searching the
 * network — so it is left alone and flagged rather than swept.
 *
 * The signature is unchanged (`isLoading` / `isError` still returned, always
 * false) so neither consumer had to be touched.
 */
export function useTeamMembers(teamName: string, enabled: boolean) {
  const members = useMemo<DirectoryMember[]>(() => {
    if (!enabled || !teamName.trim()) return [];

    const roster = MOCK_HIRING_TEAMS[teamName.trim()] ?? [];

    return roster.map((person) => ({
      uid: person.uid,
      name: person.name,
      title: person.title,
      team: teamName,
      /* Null on purpose. `MemberAvatar` falls back to `getDefaultAvatar(name)` —
         production's DiceBear helper — which returns a deterministic data-URI,
         so each person gets their own avatar with nothing fetched. Real image
         URLs would put the network back in the one component this change took
         it out of. */
      image: null,
      /* Everyone in the roster is a lead. The live version separated leads from
         the wider team because a real team runs to dozens and an intro to all of
         them isn't an intro; a mock roster is already only the people worth
         naming, so the distinction has nothing left to do here. Kept on the
         record because `DirectoryMember` is shared with the picker, which reads
         it to group and label rows. */
      isTeamLead: true,
    }));
  }, [teamName, enabled]);

  /* Same shape the live hook returned. With every mock member a lead this equals
     `members`, but both consumers ask for it by name and the two lists mean
     different things — keep them distinct rather than aliasing on a coincidence
     of the mock data. */
  const defaultRecipients = useMemo<DirectoryMember[]>(() => {
    const leads = members.filter((member) => member.isTeamLead);
    return leads.length ? leads : members;
  }, [members]);

  return { members, defaultRecipients, isLoading: false, isError: false };
}
