export interface SignupForm {
  image: File | null;
  name: string;
  email: string;
  teamOrProject: { label: string; value: string } | null;
  teamName?: string;
  websiteAddress?: string;
  role?: string;
  subscribe: boolean;
  agreed: true;
}
