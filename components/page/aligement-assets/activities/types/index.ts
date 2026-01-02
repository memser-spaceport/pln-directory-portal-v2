/**
 * Types for Activities page components
 */

export interface PointTier {
  label: string;
  points: string;
}

export interface PointCategory {
  title: string;
  tiers: PointTier[];
}

export interface PopupLink {
  text: string;
  url: string;
}

export interface RequirementItem {
  label: string;
  value: string;
}

export interface ActivityPopupContent {
  title: string;
  subtitle?: string;
  description: string;
  requirements?: RequirementItem[];
  submissionNote?: string;
  submissionLink?: PopupLink;
  links?: PopupLink[];
  pointsAwarded: {
    title: string;
    items: Array<{
      label: string;
      value?: string;
      subItems?: Array<{
        label: string;
        value?: string;
      }>;
    }>;
  };
  categories?: PointCategory[];
  additionalNote?: string;
}

export interface Activity {
  id: string;
  category: string;
  activity: string;
  networkValue: string;
  points: string;
  isAutoTracked?: boolean;
  hasFormLink?: boolean;
  popupContent: ActivityPopupContent;
}

export interface ActivitiesData {
  hero: {
    title: string;
    description: string;
    note: string;
    submitButtonLabel: string;
    suggestLinkText: string;
    suggestLinkHighlight: string;
  };
  activities: Activity[];
}


