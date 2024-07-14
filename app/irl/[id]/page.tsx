import Error from '@/components/core/error';
import { getEventDetailBySlug } from '@/services/irl.service';
import { getMember } from '@/services/members.service';
import { getMemberPreferences } from '@/services/preferences.service';
import { ADMIN_ROLE } from '@/utils/constants';
import { sortByDefault } from '@/utils/irl.utils';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import styles from './page.module.css';
import Navbar from '@/components/page/irl-details/navbar';
import Banner from '@/components/page/irl-details/banner';

export default async function IrlDetails({ params }: { params: any }) {
  const eventId = params?.id;

  const { isError, eventDetails } = await getPageData(eventId);

  if (isError) {
    return <Error />;
  }

  return (
    <div className={styles.irlDetails}>
      <div className={styles.irlDetailsWrpr}>
        <div className={styles.irlDetails__nav}>
          <Navbar />
        </div>
        <div className={styles.irlDetails__banner}>
          <Banner eventDetails={eventDetails} />
        </div>
        <div>
            
        </div>
      </div>
    </div>
  );
}

const getPageData = async (eventId: string) => {
  const { authToken, userInfo, isLoggedIn } = getCookiesFromHeaders();

  let teams = [];
  let showTelegram = true;
  let isError: boolean = false;
  const eventDetails = await getEventDetailBySlug(eventId, authToken);

  if (eventDetails.isError) {
    return { isError: true };
  }

  const type = eventDetails?.type;

  const sortedList = sortByDefault(eventDetails?.guests);
  eventDetails.guests = sortedList;

  //has current user is going for an event
  const isUserGoing = sortedList?.some((guest) => guest.memberUid === userInfo?.uid && guest?.memberUid);

  if (type === 'INVITE_ONLY' && !isLoggedIn) {
    return {
      redirect: {
        permanent: true,
        destination: '/irl',
      },
    };
  }

  if (type === 'INVITE_ONLY' && isLoggedIn && !userInfo?.roles?.includes(ADMIN_ROLE) && !isUserGoing) {
    return {
      redirect: {
        permanent: true,
        destination: '/irl',
      },
    };
  }

  if (isUserGoing) {
    const currentUser = [...sortedList]?.find((v) => v.memberUid === userInfo?.uid);
    if (currentUser) {
      const filteredList = [...sortedList].filter((v) => v.memberUid !== userInfo?.uid);
      const formattedGuests = [currentUser, ...filteredList];
      eventDetails.guests = formattedGuests;
    }
  }

  if (isLoggedIn) {
    const { uid } = userInfo;
    const [memberResponse, memberPreferencesResponse] = await Promise.all([
      getMember(uid, {
        with: 'teamMemberRoles.team',
      }),
      getMemberPreferences(uid, authToken),
    ]);

    if (memberResponse.error || memberPreferencesResponse.isError) {
      isError = true;
    }

    teams = memberResponse?.data?.formattedData.teams;
    showTelegram = memberPreferencesResponse.memberPreferences?.telegram ?? true;
  }

  return { isError, userInfo, isLoggedIn, teams, eventDetails, isUserGoing, showTelegram };
};
