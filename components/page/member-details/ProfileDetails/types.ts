export interface TEditProfileForm {
  image: File | null;
  isImageDeleted: boolean;
  name: string;
  country: string;
  state: string;
  city: string;
  skills: string[];
  openToCollaborate: boolean;
  primaryTeam: { value: string; label: string; role?: string; originalObject?: any } | null;
  primaryTeamRole: string | null;
  bio: string;
  newTeamRole: string;
  newTeamName: string;
  newTeamWebsite: string;
}
