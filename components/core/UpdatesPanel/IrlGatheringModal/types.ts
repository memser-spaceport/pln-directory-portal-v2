import { PushNotification } from '@/types/push-notifications.types';

export interface IrlGatheringModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: PushNotification;
  onGoingClick?: () => void;
}

export interface IrlGatheringFormData {
  topics: string[];
  selectedEventUids: string[];
}

export type ModalView = 'main' | 'datePicker' | 'topicsPicker';

export interface AttendeeData {
  uid: string;
  picture: string | undefined;
}

export interface Resource {
  icon?: string;
  link: string;
  name: string;
  type: 'social' | 'custom';
  isPublic: 'true' | 'false';
  description: string | null;
}

export interface EventData {
  uid: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  logoUrl: string | null;
  attendeeCount: number;
  websiteUrl: string | null;
}

export interface GatheringData {
  gatheringName: string;
  gatheringImage: string | undefined;
  aboutDescription: string;
  dateRange: string;
  locationName: string;
  eventsCount: number;
  events: EventData[];
  attendees: AttendeeData[];
  attendeesCount: number;
  planningQuestion: string;
  resources: Resource[];
  eventsLink: string;
  gatheringUid: string | undefined;
  eventDates: {
    start: string | undefined;
    end: string | undefined;
  };
}

