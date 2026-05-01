export interface IJobAlertFilterState {
  q?: string;
  roleCategory: string[];
  seniority: string[];
  focus: string[];
  location: string[];
  workMode: string[];
}

export interface IJobAlert {
  uid: string;
  name: string;
  filterState: IJobAlertFilterState;
  createdAt: string;
  updatedAt: string;
}

export interface IJobAlertsListResponse {
  items: IJobAlert[];
  total: number;
}

export interface ICreateJobAlertPayload {
  name?: string;
  filterState: IJobAlertFilterState;
}

export interface IUpdateJobAlertPayload {
  name?: string;
  filterState?: IJobAlertFilterState;
}

export interface IJobAlertConflict {
  existingAlertUid: string;
  message: string;
}
