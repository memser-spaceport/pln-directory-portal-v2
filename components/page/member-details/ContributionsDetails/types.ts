export interface TEditContributionsForm {
  name: Record<string, string>;
  role: string;
  description: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}
