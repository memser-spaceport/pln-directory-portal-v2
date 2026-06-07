import type { FundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import type { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';

export function mapTeamProfileToFundraisingProfile(team: TeamProfile): FundraisingProfile {
  return {
    uid: team.uid,
    teamUid: team.teamUid,
    team: {
      uid: team.team.uid,
      name: team.team.name,
      shortDescription: team.team.shortDescription,
      industryTags: team.team.industryTags,
      fundingStage: team.team.fundingStage,
      logo: team.team.logo,
      website: team.team.website,
    },
    onePagerUploadUid: team.onePagerUploadUid ?? team.onePagerUpload?.uid ?? null,
    onePagerUpload: team.onePagerUpload ?? null,
    videoUploadUid: team.videoUploadUid ?? team.videoUpload?.uid ?? null,
    videoUpload: team.videoUpload ?? null,
    founders: team.founders.map((founder) => ({
      ...founder,
      image: founder.image as { uid: string; url: string } | null,
    })),
    description: team.description,
    liked: team.liked ?? false,
    connected: team.connected ?? false,
    invested: team.invested ?? false,
    feedback: team.feedback ?? false,
    program: team.program,
  };
}
