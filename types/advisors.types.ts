import { IMember } from './members.types';

export type AdvisorStatus = 'INVITED' | 'ONBOARDING' | 'ACTIVE' | 'INACTIVE';
export type CalendarProvider = 'calcom' | 'calendly';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type TimeRequestStatus = 'PENDING' | 'RESPONDED';

export interface IAvailabilitySlot {
  id: string;
  advisorId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  slotDuration: 30;
  timezone: string;
}

export interface IAdvisor {
  id: string;
  memberId: string;
  member: IMember;
  bio: string;
  calendarProvider: CalendarProvider | null;
  calendarConnected: boolean;
  availabilitySlots: IAvailabilitySlot[];
  status: AdvisorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IBooking {
  id: string;
  advisorId: string;
  founderId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  preReadFileUrl: string;
  status: BookingStatus;
  createdAt: string;
}

export interface ITimeRequest {
  id: string;
  advisorId: string;
  founderId: string;
  message: string;
  status: TimeRequestStatus;
  createdAt: string;
}

export interface IBookableSlot {
  date: string;
  startTime: string;
  endTime: string;
  slotId: string;
  available: boolean;
}
