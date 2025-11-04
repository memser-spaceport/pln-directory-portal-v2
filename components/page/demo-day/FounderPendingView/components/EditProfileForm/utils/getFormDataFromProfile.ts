import { IndustryFundingOpts } from '@/components/page/demo-day/FounderPendingView/components/EditProfileForm/type';
import { FundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';

// Helper function to format Company Stage for form
const formatFundingStageForForm = (stage: string, options: IndustryFundingOpts) => {
  const option = options?.fundingStageOptions?.find((opt: { value: string }) => opt.value === stage);
  return option || null;
};

export function getFormDataFromProfile(profileData: FundraisingProfile | undefined, options: IndustryFundingOpts) {
  const { team } = profileData || {};

  return {
    image: null,
    name: team?.name || '',
    shortDescription: team?.shortDescription || '',
    tags: team?.industryTags?.map((tag) => ({ value: tag.uid, label: tag.title })) || [],
    fundingStage: team?.fundingStage ? formatFundingStageForForm(team.fundingStage.uid, options) : null,
    website: team?.website || '',
  };
}
