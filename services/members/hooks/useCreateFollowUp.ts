import { useMutation } from '@tanstack/react-query';
import { createFollowUp } from '@/services/office-hours.service';

async function mutation({ logInMemberUid, authToken, data }: { logInMemberUid: string; authToken: string; data: any }) {
  return createFollowUp(logInMemberUid, authToken, data);
}

export function useCreateFollowUp() {
  return useMutation({
    mutationFn: mutation,
  });
}
