import { DirectoryMember, RecipientOption } from '../types';

/** Prefixes the option's value so a team row can never collide with a member uid
 *  or a typed address — the three share one list, one dedupe and one ✕. */
export const TEAM_RECIPIENT_PREFIX = 'team:';

/** First names, collapsed past three — the same rule `getRecipientSummary` uses on
 *  the receipt, in first names because this is a single ellipsing line inside a
 *  menu row rather than a sentence. */
const listFirstNames = (leads: DirectoryMember[]): string => {
  const names = leads.map((lead) => lead.name.split(' ')[0]).filter(Boolean);
  if (!names.length) return '';
  if (names.length === 1) return names[0];
  if (names.length <= 3) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const rest = names.length - 2;
  return `${names.slice(0, 2).join(', ')} and ${rest} others`;
};

/**
 * The hiring team itself, as a row in the "Send to" field.
 *
 * **Why the field needs one.** Every other way of filling "Send to" assumes the
 * referrer knows somebody: pick a name they recognise, or type an address they
 * have. Someone referring into a team they have no line into has neither — the
 * menu offers four strangers, the email escape needs an address, and Send stays
 * dead. The team is the recipient that is always knowable, because it is the
 * thing the role is attached to.
 *
 * **It is a row, not a second control.** A "send to the team instead" tick beside
 * the field would be a second door into the same room; the field already owns
 * "who hears about this", so the team joins the list it holds and behaves like
 * every other row in it — pickable, removable, countable, and combinable with a
 * person once one is recognised.
 *
 * **The description is the whole point.** "The hiring team" is the one recipient
 * a person cannot see the shape of, so the row says where it lands: the address
 * the team configured, or the leads it reaches by name. Without that the row is
 * the product choosing an audience on the referrer's behalf, which is the thing
 * this field was corrected away from when the leads were preselected.
 */
export function toTeamRecipientOption(input: {
  teamId: string;
  teamName: string;
  logoUrl?: string | null;
  /** Who the row resolves to when the team has configured no inbox. */
  leads: DirectoryMember[];
  /** The team's own job-referral address, when it set one up. */
  jobReferEmail?: string | null;
}): RecipientOption {
  const { teamId, teamName, logoUrl, leads, jobReferEmail } = input;
  const inbox = jobReferEmail?.trim();
  const named = listFirstNames(leads);

  return {
    label: `${teamName} hiring team`,
    value: `${TEAM_RECIPIENT_PREFIX}${teamId || teamName}`,
    /* Three truths, in descending order of how much the reader can act on:
       the address itself, the people it reaches, or — when the directory lists
       neither — the honest generic. The last is not an apology for a gap; the
       row still routes, it just cannot name who is on the other end. */
    description: inbox || (named ? `Reaches ${named}` : 'Reaches the people hiring for this role'),
    image: logoUrl ?? null,
    isTeam: true,
  };
}
