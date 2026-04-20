import { getMockAdvisors, getMockAdvisorById, getMockBookableSlots, isAdvisorMember } from './mock-data';
import { IAdvisor, IBookableSlot, IBooking, ITimeRequest, IAvailabilitySlot } from '@/types/advisors.types';

export async function getAdvisors(): Promise<IAdvisor[]> {
  return getMockAdvisors();
}

export async function getAdvisorById(id: string): Promise<IAdvisor | null> {
  return getMockAdvisorById(id) ?? null;
}

export async function getBookableSlots(advisorId: string): Promise<IBookableSlot[]> {
  return getMockBookableSlots(advisorId);
}

export async function checkIsAdvisor(memberId: string): Promise<boolean> {
  return isAdvisorMember(memberId);
}

export async function createBooking(data: {
  advisorId: string;
  founderId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  preReadFileUrl: string;
}): Promise<IBooking> {
  return {
    id: `booking-${Date.now()}`,
    ...data,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  };
}

export async function createTimeRequest(data: {
  advisorId: string;
  founderId: string;
  message: string;
}): Promise<ITimeRequest> {
  return {
    id: `request-${Date.now()}`,
    ...data,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
}

export async function connectCalendar(provider: 'calcom' | 'calendly'): Promise<{ connected: boolean }> {
  return { connected: true };
}

export async function setAvailability(slots: Omit<IAvailabilitySlot, 'id'>[]): Promise<IAvailabilitySlot[]> {
  return slots.map((s, i) => ({ ...s, id: `slot-new-${i}` }));
}
