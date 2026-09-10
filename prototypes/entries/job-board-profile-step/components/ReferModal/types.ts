/** A directory member reduced to what this modal needs: a picker row (avatar, name,
 *  role · team) and the facts the drafted note states. Mapped from the production
 *  member calls in `useMemberSearch` and `useTeamMembers` — every field but `uid`/`name`
 *  can be empty, because real records are. */
export interface DirectoryMember {
  uid: string;
  name: string;
  /** Role on the hiring team when known, otherwise their main-team role. Empty when the directory has none on record. */
  title: string;
  /** Main team's name. Empty for members with no team. */
  team: string;
  /** Uploaded avatar; the generated one stands in when it's null. */
  image: string | null;
  /** What they're tagged as working on — the note's "why them" sentence is built from
   *  these. Only search results carry them; the hiring-team fetch doesn't select them,
   *  and doesn't need to (recipients are never the candidate). */
  skills?: string[];
  /** Leads the hiring team. Only `useTeamMembers` sets this — it's a fact about a
   *  member's role on one specific team, not about the member. */
  isTeamLead?: boolean;
}

export interface RecipientOption {
  label: string;
  value: string;
  /** Role · team line under the name. Absent for raw email addresses. */
  description?: string;
  /** Avatar of the member behind this chip. Absent for raw email addresses. */
  image?: string | null;
  /** True for an address typed into the field rather than picked from the network. */
  isEmail?: boolean;
  /** Leads the hiring team. Suggested first in the picker's menu; shown as a chip mark. */
  isTeamLead?: boolean;
  /** Set by react-select's Creatable on the "Add ‹address›" row, before it's chosen. */
  __isNew__?: boolean;
}

/** Someone the referrer vouches for who has no directory record. Three facts, all
 *  required, because they are the whole record: the name is who the note is
 *  about, the email is how the hiring team reaches them (and how they're copied,
 *  if the referrer ticks that), and the LinkedIn profile is the only way anyone
 *  reading the email can check who they are — the thing a member's directory
 *  page does for a member. */
export interface OutsidePerson {
  name: string;
  email: string;
  /** As typed — a bare slug or a URL, the same shapes the profile's own LinkedIn
   *  field accepts. `linkedinProfileUrl` turns it into a link for the note. */
  linkedin: string;
}
