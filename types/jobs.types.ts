export interface IJobRole {
  uid: string;
  roleTitle: string;
  roleCategory: string | null;
  seniority: string | null;
  location: string[];
  workMode: string | null;
  applyUrl: string | null;
  lastUpdated: string;
  postedDate: string | null;
  detectionDate: string | null;
}

export interface IJobTeam {
  uid: string;
  name: string;
  logoUrl: string | null;
  focusAreas: string[];
  subFocusAreas: string[];
}

export interface IJobTeamGroup {
  team: IJobTeam;
  totalRoles: number;
  roles: IJobRole[];
}

export interface IJobsListResponse {
  groups: IJobTeamGroup[];
  page: number;
  limit: number;
  total: number;
  totalGroups: number;
  totalRoles: number;
}

export interface IJobsFacetItem {
  value: string;
  count: number;
}

export interface IJobsFacetTreeItem extends IJobsFacetItem {
  children: IJobsFacetItem[];
}

export interface IJobsFiltersResponse {
  roleCategory: IJobsFacetItem[];
  seniority: IJobsFacetItem[];
  focus: IJobsFacetTreeItem[];
  location: IJobsFacetItem[];
  workMode: IJobsFacetItem[];
}

export type JobsSortKey = 'newest' | 'company_az';

export type JobsFilterKey = 'roleCategory' | 'seniority' | 'focus' | 'location' | 'workplaceType';
