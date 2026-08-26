import { IListOptions } from './shared.types';

export interface ITeamsSearchParams {
  searchBy?: string;
  sort?: string;
  tags: string;
  membershipSources: string;
  fundingStage: string;
  technology: string;
  includeFriends: string;
  viewType?: string;
  page?: string;
  officeHoursOnly: string;
  focusAreas: string;
  isRecent: string;
  isHost: string;
  isSponsor: string;
  asks?: string;
  isFund?: string;
  minTypicalCheckSize?: string;
  maxTypicalCheckSize?: string;
  investmentFocus?: string;
  priorities?: string;
  tiers?: string;
  communityAffiliations?: string;
  followingOnly?: 'true' | '';
  /** Directory Admin only; non-admins are always scoped to ACTIVE regardless of this value. */
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
}

export interface CheckboxFilterOption {
  selected: boolean;
  value: string;
  disabled: boolean;
  count?: number;
}

export interface ITeamFilterSelectedItems {
  tags: CheckboxFilterOption[];
  membershipSources: CheckboxFilterOption[];
  communityAffiliations: CheckboxFilterOption[];
  fundingStage: CheckboxFilterOption[];
  technology: CheckboxFilterOption[];
  focusAreas: any;
  asks: CheckboxFilterOption[];
  priorities: { value: string; count: number; selected: boolean; disabled: boolean }[];
}

export type ITeamListOptions = IListOptions & {
  'technologies.title__with'?: string;
  'membershipSources.title__with'?: string;
  'industryTags.title__with'?: string;
  'fundingStage.title__with'?: string;
  'teamMemberRoles.member.uid'?: string;
  plnFriend?: boolean;
  askTags?: string;
};

export type TeamStatus = 'ACTIVE' | 'INACTIVE';

export interface ITeamResponse {
  uid?: string;
  tier?: string | number;
  priority?: number;
  logo?: { url: string | null };
  name?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  website?: string | null;
  twitter?: string | null;
  contactMethod?: string | null;
  jobReferEmail?: string | null;
  fundingStage: { title: string };
  membershipSources: ITag[];
  industryTags: ITag[];
  technologies: ITag[];
  members?: string[];
  teamMemberRoles?: [];
  linkedinHandler?: string;
  twitterHandler?: string;
  blueskyHandler?: string | null;
  crunchbaseHandler?: string | null;
  dateFounded?: number | null;
  teamSize?: string | number | null;
  location?: string | null;
  status?: TeamStatus | null;
  linkedinHandle?: string | null;
  createdAt?: string;
  asks?: string[];
  isFollowed?: boolean;
}

export interface ITag {
  uid: string;
  title: string;
  color?: string;
  icon?: React.ReactNode;
}

export interface ITeamAsk {
  uid: string;
  title: string;
  tags: string[];
  description: string;
  teamUid: string;
  status: 'OPEN' | 'CLOSED';
  closedReason?: string;
  closedComment: string;
  closedBy?: {
    name: string;
    uid: string;
    image: { url: string };
  };
}

export interface ITeam {
  tier?: string | number;
  priority?: number;
  asks: ITeamAsk[];
  role?: string;
  id: string;
  logo?: string;
  logoUid?: string;
  name?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  website?: string | null;
  twitter?: string | null;
  contactMethod?: string | null;
  jobReferEmail?: string | null;
  fundingStage?: { title: string };
  membershipSources?: ITag[];
  communityAffiliations?: ITag[];
  industryTags?: ITag[];
  technologies?: ITag[];
  mainTeam?: boolean;
  teamLead?: boolean;
  linkedinHandle?: string | null;
  maintainingProjects: any[];
  contributingProjects: any[];
  officeHours?: string | null;
  teamFocusAreas: any[];
  eventGuests?: any;
  associations?: any;
  isFund?: boolean;
  investmentTeam?: boolean;
  investorProfile?: {
    uid: string;
    investmentFocus: string[] | undefined;
    typicalCheckSize: string | undefined;
    createdAt: string;
    updatedAt: string;
    teamUid: string;
    memberUid: null;
    secRulesAccepted: boolean;
    investInStartupStages: string[];
    investInFundTypes: string[];
  };
  dataEnrichment?: {
    isAIGenerated?: boolean;
    status?: string;
    [key: string]: unknown;
  };
  telegramHandler?: string | null;
  blueskyHandler?: string | null;
  crunchbaseHandler?: string | null;
  /** Founding year, as a 4-digit integer (e.g. 2014). */
  dateFounded?: number | null;
  /** Employee count (as a number) or a range label (e.g. "11-50"). Stored as text by the API. */
  teamSize?: string | number | null;
  /** Free-text place label, e.g. "San Francisco, United States". */
  location?: string | null;
  /** Absent or null counts as `ACTIVE` — see `isTeamInactive`. */
  status?: TeamStatus | null;
  blog?: string | null;
  isFollowed?: boolean;
}

export interface ITeamDetailParams {
  id: string;
}

export interface IFormatedTeamProject {
  uid: string;
  logo: { url: string };
  tagline: string;
  name: string;
  lookingForFunding: boolean;
  hasEditAccess: boolean;
  isDeleted: boolean;
  isMaintainingProject: boolean;
}
