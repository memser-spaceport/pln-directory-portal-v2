import { useMutation } from '@tanstack/react-query';

type MutationParams = {
  id: string;
};

async function mutation({ id }: MutationParams) {
  return true;
}

export function useRemoveRecentSearch() {
  return useMutation({
    mutationFn: mutation,
  });
}
