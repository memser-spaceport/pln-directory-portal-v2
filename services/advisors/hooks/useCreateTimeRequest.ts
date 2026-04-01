import { useMutation } from '@tanstack/react-query';
import { createTimeRequest } from '../advisors.service';

export function useCreateTimeRequest() {
  return useMutation({
    mutationFn: createTimeRequest,
  });
}
