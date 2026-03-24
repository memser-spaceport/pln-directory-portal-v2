import { IUserInfo } from '@/types/shared.types';

export interface FocusAreasData {
  teamFocusAreas: any[];
  projectFocusAreas: any[];
}

export interface FocusAreaSectionProps {
  focusAreas: FocusAreasData;
  userInfo: IUserInfo;
}
