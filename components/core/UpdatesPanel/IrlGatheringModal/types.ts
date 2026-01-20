import { PushNotification } from '@/types/push-notifications.types';

export interface EditModeInitialData {
  guestUid: string;
  teamUid?: string;
  teamName?: string;
  teamLogo?: string;
  events?: Array<{
    uid: string;
    name?: string;
    isHost?: boolean;
    isSpeaker?: boolean;
  }>;
  additionalInfo?: {
    checkInDate?: string;
    checkOutDate?: string;
  };
  topics?: string[];
  reason?: string;
  telegramId?: string;
  officeHours?: string;
}

export interface IrlGatheringModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: PushNotification;
  onGoingClick?: () => void;
  isEditMode?: boolean;
  editModeData?: EditModeInitialData;
}

export type EventRole = 'Attendee' | 'Speaker' | 'Host';

export interface EventRoleSelection {
  eventUid: string;
  roles: EventRole[];
}

export interface TeamOption {
  uid: string;
  name: string;
  logo?: string | null;
}

export interface SelectedTeamOption {
  value: string;
  label: string;
}

export interface IrlGatheringFormData {
  topics: string[];
  selectedEventUids: string[];
  eventRoles: EventRoleSelection[];
  additionalDetails: string;
  selectedTeam?: SelectedTeamOption;
  telegramHandle: string;
  officeHours: string;
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
  description?: string | null;
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
  teams?: TeamOption[];
}

