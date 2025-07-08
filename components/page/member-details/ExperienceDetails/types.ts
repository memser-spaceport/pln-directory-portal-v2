export interface TEditExperienceForm {
  title: string;
  company: string;
  description: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  location: string;
}
