/**
 * Views and clicks of a logged-in member, sent to the backend member signal
 * log (LAB-3123, LAB-3267). Mirrors `MemberSignalBodySchema` in the directory API.
 */
export type MemberSignalAction =
  | 'view'
  | 'contact-click'
  | 'contact-copy'
  | 'team-contact-click'
  | 'project-link-click'
  | 'github-project-click'
  | 'search-result-click'
  | 'job-apply-click';

export type MemberSignalEntityType = 'member' | 'team' | 'project' | 'news-item' | 'job-opening' | 'event';

export interface IMemberSignal {
  action: MemberSignalAction;
  entityType: MemberSignalEntityType;
  /** Uid of the entity. */
  entityId: string;
}
