/**
 * Views and clicks of a logged-in member, sent to the backend member signal
 * log (LAB-3123). Mirrors `MemberSignalBodySchema` in the directory API.
 */
export type MemberSignalAction =
  | 'view'
  | 'contact-click'
  | 'contact-copy'
  | 'team-contact-click'
  | 'project-link-click'
  | 'github-project-click'
  | 'search-result-click';

export type MemberSignalEntityType = 'member' | 'team' | 'project';

export interface IMemberSignal {
  action: MemberSignalAction;
  entityType: MemberSignalEntityType;
  /** Uid of the member, team or project. */
  entityId: string;
}
