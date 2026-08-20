import { omit } from 'lodash';

import { IMemberUpdatePayload, IMemberUpdateSource } from '@/types/members.types';

/**
 * `PUT /v1/member/{uid}` replaces the whole member record, so every form that saves a single
 * section still has to send every other section's fields back untouched. Keeping that
 * carry-through list in one place stops a new field from being added to some forms and
 * forgotten in others — which silently drops the value the next time an unrelated section
 * is saved.
 *
 * Add new member fields HERE, not in the individual forms.
 *
 * Setting an override to `undefined` drops the field from the request, since the payload is
 * serialised with `JSON.stringify`. Use that for fields a form deliberately updates elsewhere.
 */
export function buildMemberUpdatePayload(
  memberInfo: IMemberUpdateSource,
  overrides: IMemberUpdatePayload = {},
): IMemberUpdatePayload {
  return {
    imageUid: memberInfo.imageUid,
    name: memberInfo.name,
    email: memberInfo.email,
    plnStartDate: memberInfo.plnStartDate,
    city: memberInfo?.location?.city || '',
    region: memberInfo?.location?.region || '',
    country: memberInfo?.location?.country || '',
    teamOrProjectURL: memberInfo.teamOrProjectURL,
    linkedinHandler: memberInfo.linkedinHandler,
    discordHandler: memberInfo.discordHandler,
    twitterHandler: memberInfo.twitterHandler,
    blueskyHandler: memberInfo.blueskyHandler,
    githubHandler: memberInfo.githubHandler,
    telegramHandler: memberInfo.telegramHandler,
    officeHours: memberInfo.officeHours,
    moreDetails: memberInfo.moreDetails,
    openToWork: memberInfo.openToWork,
    plnFriend: memberInfo.plnFriend,
    teamAndRoles: memberInfo.teamMemberRoles,
    projectContributions: memberInfo.projectContributions?.map((contribution: any) => ({
      ...omit(contribution, 'projectName'),
    })),
    skills: memberInfo.skills?.map((skill: any) => ({
      title: skill.name,
      uid: skill.id,
    })),
    bio: memberInfo.bio,
    currentCompany: memberInfo.currentCompany,
    /* Carried like every other field, and for exactly the reason this helper
       exists: the job board sets this from its own drawer, and without it here
       the next save of an unrelated section — a bio edit, a contribution —
       would post the whole record back without it and silently clear the
       answer that gates applying. */
    jobSearchStatus: memberInfo.jobSearchStatus,
    ...overrides,
  };
}
