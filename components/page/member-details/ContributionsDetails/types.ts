export interface TEditContributionsForm {
  name: Record<string, string>;
  role: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
}
