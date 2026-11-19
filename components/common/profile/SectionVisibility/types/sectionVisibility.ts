export type SectionVisibilityLevel = 'public' | 'shared';

export interface SectionVisibility {
  level: SectionVisibilityLevel;
  label: string;
  description: string;
}
