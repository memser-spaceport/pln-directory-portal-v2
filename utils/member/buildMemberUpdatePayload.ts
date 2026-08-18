import { omit } from 'lodash';

/**
 * `PUT /v1/member/{uid}` replaces the whole member record, so every form that saves a single
 * section still has to send every other section's fields back untouched. Keeping that
 * carry-through list in one place stops a new field from being added to some forms and
 * forgotten in others — which silently drops the value the next time an unrelated section
 * is saved.
 *
 * Add new member fields HERE, not in the individual forms.
 */

/** Raw member record as returned by the API (`memberData.memberInfo`). */
export interface IMemberUpdateSource {
  imageUid?: string | null;
  name?: string;
  email?: string;
  plnStartDate?: string | null;
  location?: { city?: string | null; region?: string | null; country?: string | null } | null;
  teamOrProjectURL?: string | null;
  linkedinHandler?: string | null;
  discordHandler?: string | null;
  twitterHandler?: string | null;
  githubHandler?: string | null;
  telegramHandler?: string | null;
  officeHours?: string | null;
  moreDetails?: string | null;
  openToWork?: boolean;
  plnFriend?: boolean;
  teamMemberRoles?: any[];
  projectContributions?: any[];
  skills?: { id?: string; name?: string }[];
  bio?: string | null;
}

/** Shape of `newData` accepted by the member update endpoint. */
export interface IMemberUpdatePayload {
  imageUid?: string | null;
  name?: string;
  email?: string;
  plnStartDate?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  teamOrProjectURL?: string | null;
  linkedinHandler?: string | null;
  discordHandler?: string | null;
  twitterHandler?: string | null;
  githubHandler?: string | null;
  telegramHandler?: string | null;
  officeHours?: string | null;
  moreDetails?: string | null;
  openToWork?: boolean;
  plnFriend?: boolean;
  teamAndRoles?: any[];
  projectContributions?: any[];
  skills?: { title?: string; uid?: string }[];
  bio?: string | null;
}

/**
 * Builds the full `newData` payload from the current member record, then applies the caller's
 * overrides for the section it actually edits.
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
    ...overrides,
  };
}
