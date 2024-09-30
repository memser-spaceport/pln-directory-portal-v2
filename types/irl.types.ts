export interface IIrlCard {
  id: string;
  name: string;
  description: string;
  location: string;
  slugUrl: string;
  bannerUrl: string;
  startDate: Date;
  endDate: Date;
  type: string;
  attendees: number;
  priority: number;
  userInfo?: any;
}
export interface IIrlLocationCard {
  id: number;
  location: string;
  flag: string;
  icon: string;
  pastEvents: any;
  upcomingEvents: any;
  isActive: boolean;
}
