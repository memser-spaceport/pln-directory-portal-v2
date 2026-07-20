/**
 * Types for Activities page components
 */

export interface PointTier {
  label: string;
  points: string;
}

export interface PointCategory {
  title: string;
  description?: string;
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
  description?: string;
  /**
   * Structured long-form copy for the new activity set.
   * When `overview` is present the modal renders the
   * 👀 Overview / 🤝 Network Benefits / 📏 Rules layout instead of the
   * legacy points-tier layout. Paragraphs are separated by `\n\n`.
   */
  overview?: string;
  networkBenefits?: string;
  rules?: string[];
  submitButtonText?: string;
  requirements?: RequirementItem[];
  submissionNoteTitle?: string;
  submissionNote?: string;
  submissionLink?: PopupLink;
  ctaLink?: string;
  links?: PopupLink[];
  pointsAwarded?: {
    title: string;
    subtitle?: Array<{
      label: string;
      value?: string;
    }>;
    description?: string;
    items: Array<{
      label: string;
      value?: string;
      description?: string;
      boldLabel?: boolean;
      italicValue?: boolean;
      valueOnNewLine?: boolean;
      subItems?: Array<{
        label: string;
        value?: string;
      }>;
    }>;
  };
  additionalPointsAwarded?: {
    title: string;
    items: Array<{
      label: string;
      value?: string;
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
  frequency?: 'Repeatable' | 'Recurring' | 'One-Time';
  verificationType?: 'Auto' | 'Submission' | 'Manual Review';
  /**
   * CTA behavior: `submit` opens the PLAA form in a new tab;
   * `confirm` fires the confirmation toast without navigating.
   */
  cta?: 'submit' | 'confirm';
  isAutoTracked?: boolean;
  hasFormLink?: boolean;
  popupContent: ActivityPopupContent;
}

export interface ActivitiesData {
  hero: {
    title: string;
    description: string;
    note: string;
  };
  activities: Activity[];
}


