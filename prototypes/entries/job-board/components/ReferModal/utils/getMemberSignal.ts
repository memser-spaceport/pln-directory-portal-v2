import { DirectoryMember } from '../types';

const MAX_SKILLS = 3;

/**
 * The note's "why them" sentence.
 *
 * The mocked members carried this as prose — "She spent the last three years on libp2p
 * transports and has shipped two production DHT rewrites." — and the directory has
 * nothing of the kind: no bio travels on a member record (checked on both
 * `/v1/members-search` and `/v1/members/:uid`). What it does know is what a member is
 * tagged as working on, so that's what the draft can assert; the referrer supplies the
 * rest, which is what the field is for.
 *
 * Capped at three because the tags run broad — Juan Benet's record lists six, down to
 * "Strategy" and "Fundraising" — and a list that long reads as filler in a short email.
 * Members with none tagged get no sentence rather than an empty one.
 */
export function getMemberSignal(member: DirectoryMember): string {
  const skills = (member.skills ?? []).filter(Boolean).slice(0, MAX_SKILLS);

  if (!skills.length) return '';

  const list = skills.length === 1 ? skills[0] : `${skills.slice(0, -1).join(', ')} and ${skills[skills.length - 1]}`;

  return `Their work covers ${list}.`;
}
