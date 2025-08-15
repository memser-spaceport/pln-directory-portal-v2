export interface TEditProfileForm {
  image: File | null;
  name: string;
  country: string;
  state: string;
  city: string;
  skills: { [key: string]: any }[];
  openToCollaborate: boolean;
}
