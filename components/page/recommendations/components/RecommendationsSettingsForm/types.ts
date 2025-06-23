export type TRecommendationsSettingsForm = {
  enabled: boolean;
  frequency: { value: number; label: string };
  industryTags: { value: string; label: string }[];
  roles: { value: string; label: string }[];
  fundingStage: { value: string; label: string }[];
};
