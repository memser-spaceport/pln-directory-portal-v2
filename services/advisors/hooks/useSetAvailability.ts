import { useMutation } from '@tanstack/react-query';
import { setAvailability } from '../advisors.service';

export function useSetAvailability() {
  return useMutation({
    mutationFn: setAvailability,
  });
}
