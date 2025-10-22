export interface TEditRepositoriesForm {
  title: string;
  company: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  location: string;
}
