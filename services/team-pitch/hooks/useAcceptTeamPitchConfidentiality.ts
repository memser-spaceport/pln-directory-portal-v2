import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { TeamPitchQueryKeys } from '@/services/team-pitch/constants';

export function useAcceptTeamPitchConfidentiality(pitchSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { accepted: boolean }) => {
      const url = `${process.env.DIRECTORY_API_URL}/v1/team-pitches/${pitchSlug}/confidentiality-policy`;
      const response = await customFetch(
        url,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        true,
      );
      if (!response?.ok) throw new Error('Failed to accept confidentiality');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TeamPitchQueryKeys.ACCESS, pitchSlug] });
      queryClient.invalidateQueries({ queryKey: [TeamPitchQueryKeys.PITCH, pitchSlug] });
    },
  });
}
