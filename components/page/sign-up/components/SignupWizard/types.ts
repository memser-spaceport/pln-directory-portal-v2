export interface SignupForm {
  image: File | null;
  name: string;
  email: string;
  teamOrProject: string | Record<string, string>;
  subscribe: boolean;
  agreed: true;
}
