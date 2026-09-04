'use client';

import { useMemo } from 'react';

import { MOCK_HIRING_TEAMS } from '../../../mocks';

import { DirectoryMember } from '../types';

/**
 * The hiring team: the group the "Send to" menu opens on, the suggestion chips
 * under it, and the application pane's "Reviewed by" line.
 *
 * **Mock-backed in this folder** — served synchronously from `MOCK_HIRING_TEAMS`
 * (see the note on it in `mocks.ts`). The job-board copy of this hook makes two
 * real directory calls (`searchTeamsByName` → `getMembersForProjectForm`) because
 * production renders that tree; this folder is mocked end to end, and on the
 * shared deploy those calls 404 (`DIRECTORY_API_URL` is unset), which left every
 * surface fed by this hook invisible to exactly the reviewers the link is for.
 *
 * `enabled` is kept unused for signature parity with the live copy, so the two
 * trees stay drop-in swappable.
 */
export function useTeamMembers(teamName: string, enabled: boolean) {
  const members = useMemo<DirectoryMember[]>(
    () =>
      (MOCK_HIRING_TEAMS[teamName] ?? []).map((member) => ({
        uid: member.uid,
        name: member.name,
        title: member.title,
        team: teamName,
        image: null,
        // The mock lists who reads an application — the leads, by construction
        // (see the "Two or three each" note on MOCK_HIRING_TEAMS).
        isTeamLead: true,
      })),
    [teamName],
  );

  // Everyone in the mock is a lead, so the two lists coincide. Kept under the
  // live copy's key: the name dates from when these were seeded into the refer
  // modal's field, and production's `components/page/jobs/JobApplicationPane`
  // destructures it from the job-board tree — parity keeps the copies swappable.
  return { members, defaultRecipients: members, isLoading: false, isError: false };
}
