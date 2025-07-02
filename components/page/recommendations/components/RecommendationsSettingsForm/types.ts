export type TRecommendationsSettingsForm = {
  enabled: boolean;
  frequency: { value: number; label: string };
  // industryTags: { value: string; label: string }[];
  roles: string[];
  fundingStage: { value: string; label: string }[];
  teamTechnology: { value: string; label: string }[];
  keywords: string[];
};
