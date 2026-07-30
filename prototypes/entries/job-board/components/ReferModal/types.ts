export interface RecipientOption {
  label: string;
  value: string;
  /** Role · team line under the name. Absent for raw email addresses. */
  description?: string;
  /** True for an address typed into the field rather than picked from the network. */
  isEmail?: boolean;
  /** Set by react-select's Creatable on the "Add ‹address›" row, before it's chosen. */
  __isNew__?: boolean;
}
