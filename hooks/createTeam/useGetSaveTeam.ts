import Cookies from 'js-cookie';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';

import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';

import { toast } from '@/components/core/ToastContainer';
import { saveRegistrationImage } from '@/services/registration.service';
import { createParticipantRequest } from '@/services/participants-request.service';

import { useJoinNetworkAnalytics } from '@/analytics/join-network.analytics';

export function useGetSaveTeam(onSuccess: () => void) {
  const analytics = useJoinNetworkAnalytics();

  async function saveTeam(formattedData: any) {
    analytics.recordTeamJoinNetworkSave('save-click', formattedData);

    try {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
      
      if (formattedData?.teamProfile && formattedData.teamProfile.size > 0) {
        const imgResponse = await saveRegistrationImage(formattedData?.teamProfile);
        const image: any = imgResponse?.image;
        formattedData.logoUid = image.uid;
        formattedData.logoUrl = image.url;
        delete formattedData.teamProfile;
        delete formattedData.imageFile;
      }

      if (isEmpty(formattedData.longDescription)) {
        formattedData.longDescription = formattedData.shortDescription;
      }

      const data = {
        participantType: 'TEAM',
        status: 'PENDING',
        requesterEmailId: formattedData?.requestorEmail,
        uniqueIdentifier: formattedData?.name,
        newData: { ...formattedData },
      };

      const authToken = Cookies.get('authToken') || '';
      const response = await createParticipantRequest(data, authToken);

      if (response.ok) {
        if (isFunction(onSuccess)) {
          onSuccess();
        }

        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        analytics.recordTeamJoinNetworkSave('save-success', data);
      } else {
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
        analytics.recordTeamJoinNetworkSave('save-error', data);
      }
    } catch (err) {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
      analytics.recordTeamJoinNetworkSave('save-error');
    }
  }

  return saveTeam;
}
