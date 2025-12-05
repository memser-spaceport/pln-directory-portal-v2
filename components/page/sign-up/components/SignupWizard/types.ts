export interface SignupForm {
  image: File | null;
  name: string;
  email: string;
  teamOrProject: { label: string; value: string; type: 'team' | 'project' } | null;
  teamName?: string;
  websiteAddress?: string;
  role?: string;
  about?: string;
  subscribe: boolean;
  agreed: true;
}
