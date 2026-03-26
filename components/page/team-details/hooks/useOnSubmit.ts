import { useTransition } from 'react';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

import { ITeam } from '@/types/teams.types';

import { updateTeam } from '@/services/teams.service';
import { revalidateTeamDetail } from '@/app/actions/teams.actions';
import { toast } from '@/components/core/ToastContainer';

export function useOnSubmit(team: ITeam, toggleIsEditMode: () => void) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onSubmit(data: Record<string, unknown>) {
    const authToken = Cookies.get('authToken');

    if (!authToken || !team) {
      return;
    }

    const payload = {
      participantType: 'TEAM',
      referenceUid: team.id,
      uniqueIdentifier: team.name,
      newData: {
        ...team,
        ...data,
      },
    };

    try {
      const { isError } = await updateTeam(payload, JSON.parse(authToken), team.id);

      if (isError) {
        toast.error('Team updated failed. Something went wrong, please try again later');
        return;
      }

      toast.success('Team updated successfully');
      await revalidateTeamDetail();
      startTransition(() => {
        router.refresh();
        toggleIsEditMode();
      });
    } catch {
      toast.error('Team updated failed. Something went wrong, please try again later');
    }
  }

  return { onSubmit, isPending };
}
