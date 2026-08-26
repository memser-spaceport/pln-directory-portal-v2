/** A directory member reduced to what this modal needs: a picker row (avatar, name,
 *  role · team) and the facts the drafted note states. Mapped from the production
 *  member calls in `useMemberSearch` and `useTeamMembers` — every field but `uid`/`name`
 *  can be empty, because real records are. */
export interface DirectoryMember {
  uid: string;
  name: string;
  /** Role on their main team. Empty when the directory has none on record. */
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
  /** Leads the hiring team. Prefills the picker; shown as a chip mark. */
  isTeamLead?: boolean;
  /** Set by react-select's Creatable on the "Add ‹address›" row, before it's chosen. */
  __isNew__?: boolean;
}
