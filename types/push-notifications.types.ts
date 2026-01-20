/**
 * Push notification types for WebSocket-based real-time notifications
 */

export interface PushNotification {
  id: string;
  uid?: string; // Backend returns uid, normalized to id in provider
  category: PushNotificationCategory;
  title: string;
  description?: string;
  image?: string;
  link?: string;
  metadata?: Record<string, unknown>;
  isPublic: boolean;
  recipientUid?: string | null;
  accessLevels?: string[];
  isRead?: boolean;
  createdAt: string;
}

// IRL Gathering metadata types
export interface IrlGatheringEventItem {
  uid: string;
  name: string;
  slug: string;
  endDate: string;
  logoUrl: string | null;
  startDate: string;
  attendeeCount: number;
  telegramId: string | null;
  websiteUrl: string | null;
}

export interface IrlGatheringAttendee {
  imageUrl: string | null;
  memberUid: string;
  displayName: string;
  eventsCount: number;
}

export interface IrlGatheringLocation {
  id: string;
  flag: string | null;
  icon: string | null;
  name: string;
  country: string;
  latitude: string;
  timezone: string;
  longitude: string;
  resources: {
    icon?: string;
    link: string;
    name: string;
    type: 'social' | 'custom';
    isPublic: 'true' | 'false';
    description: string | null;
    id?: string;
  }[];
}

export interface IrlGatheringTeam {
  uid: string;
  name: string;
  logo?: string | null;
}

export interface IrlGatheringMetadata {
  ui: {
    eventSlugs: string[];
    locationUid: string;
  };
  events: {
    dates: {
      end: string;
      start: string;
    };
    items: IrlGatheringEventItem[];
    total: number;
    eventUids: string[];
  };
  version: number;
  location: IrlGatheringLocation;
  ruleKind: string;
  attendees: {
    total: number;
    topAttendees: IrlGatheringAttendee[];
  };
  gatheringUid: string;
  teams?: IrlGatheringTeam[];
}

export type PushNotificationCategory =
  | 'DEMO_DAY_LIKE'
  | 'DEMO_DAY_CONNECT'
  | 'DEMO_DAY_ANNOUNCEMENT'
  | 'DEMO_DAY_INVEST'
  | 'DEMO_DAY_REFERRAL'
  | 'DEMO_DAY_FEEDBACK'
  | 'FORUM_POST'
  | 'FORUM_REPLY'
  | 'EVENT'
  | 'IRL_GATHERING'
  | 'SYSTEM';

export interface NotificationUpdatePayload {
  id: string;
  status: 'read' | 'deleted';
}

export interface NotificationCountPayload {
  unreadCount: number;
}

// WebSocket event names
export enum WebSocketEvent {
  // Server -> Client
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_UPDATE = 'notification:update',
  NOTIFICATION_COUNT = 'notification:count',
  CONNECTION_SUCCESS = 'connection:success',
  CONNECTION_ERROR = 'connection:error',

  // Client -> Server
  MARK_READ = 'notification:markRead',
  MARK_ALL_READ = 'notification:markAllRead',
}

// Category display configuration
export const CATEGORY_CONFIG: Record<PushNotificationCategory, { label: string; icon: string; color: string }> = {
  DEMO_DAY_LIKE: { label: 'Demo Day', icon: 'calendar', color: '#156FF7' },
  DEMO_DAY_CONNECT: { label: 'Demo Day', icon: 'calendar', color: '#156FF7' },
  DEMO_DAY_INVEST: { label: 'Demo Day', icon: 'calendar', color: '#156FF7' },
  DEMO_DAY_ANNOUNCEMENT: { label: 'Demo Day', icon: 'calendar', color: '#156FF7' },
  DEMO_DAY_REFERRAL: { label: 'Demo Day', icon: 'calendar', color: '#156FF7' },
  DEMO_DAY_FEEDBACK: { label: 'Demo Day', icon: 'calendar', color: '#156FF7' },
  FORUM_POST: { label: 'Forum', icon: 'forum', color: '#10B981' },
  FORUM_REPLY: { label: 'Forum', icon: 'forum', color: '#10B981' },
  EVENT: { label: 'Events', icon: 'event', color: '#8B5CF6' },
  IRL_GATHERING: { label: 'Events', icon: 'event', color: '#8B5CF6' },
  SYSTEM: { label: 'System', icon: 'system', color: '#6B7280' },
};
