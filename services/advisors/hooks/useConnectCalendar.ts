import { useMutation } from '@tanstack/react-query';
import { connectCalendar } from '../advisors.service';

export function useConnectCalendar() {
  return useMutation({
    mutationFn: connectCalendar,
  });
}
