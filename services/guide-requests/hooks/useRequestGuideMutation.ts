import { useMutation } from '@tanstack/react-query';

import { createGuideRequest, GuideRequestPayload } from '../guide-requests.service';

export function useRequestGuideMutation() {
  return useMutation<boolean, Error, GuideRequestPayload>({
    mutationFn: (payload) => createGuideRequest(payload),
  });
}
