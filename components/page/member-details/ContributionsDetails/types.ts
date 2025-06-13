export interface TEditContributionsForm {
  name: { label: string; value: string } | null;
  role: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
}
