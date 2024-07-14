import Error from '@/components/core/error';
import { getEventDetailBySlug } from '@/services/irl.service';
import { getMember } from '@/services/members.service';
import { getMemberPreferences } from '@/services/preferences.service';
import { ADMIN_ROLE, PAGE_ROUTES } from '@/utils/constants';
import { isPastDate, sortByDefault, splitResources } from '@/utils/irl.utils';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import styles from './page.module.css';
import Navbar from '@/components/page/irl-details/navbar';
import Banner from '@/components/page/irl-details/banner';
import Resources from '@/components/page/irl-details/resources';
import HeaderStrip from '@/components/page/irl-details/header-strip';
import IrlMain from '@/components/page/irl-details/irl-main';
import ScrollToTop from '@/components/page/irl-details/scroll-to-top';

export default async function IrlDetails({ params }: { params: any }) {
  const eventId = params?.id;

  const { isError, eventDetails, isLoggedIn, userInfo, isUserGoing, teams, showTelegram } = await getPageData(eventId);

  if (isError) {
    return <Error />;
  }

  return (
    <div className={styles.irlDetails}>
      <div className={styles.irlDetailsWrpr}>
        <div className={styles.irlDetails__nav}>
          <Navbar userInfo={userInfo} eventDetails={eventDetails} />
        </div>
        <div className={styles.irlDetails__banner}>
          <Banner eventDetails={eventDetails} />
        </div>
        {eventDetails?.resources?.length > 0 && (
          <div className={styles.irlDetails__resources}>
            <Resources userInfo={userInfo} eventDetails={eventDetails} isUserLoggedIn={isLoggedIn} />
          </div>
        )}
        {!isLoggedIn && !isPastDate(eventDetails?.endDate) && (
          <div className={styles.irlDetails__loginStrip}>
            <HeaderStrip eventDetails={eventDetails} />
          </div>
        )}
        <IrlMain eventDetails={eventDetails} userInfo={userInfo} isUserGoing={isUserGoing} isUserLoggedIn={isLoggedIn} teams={teams} showTelegram={showTelegram} />
        <div>
          <ScrollToTop pageName="Irl Detail" />
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
  const resources = eventDetails?.resources ?? [];
  const publicResources = splitResources(resources)?.publicResources;
  const totalResources = isLoggedIn ? [...resources] : [...publicResources];
  eventDetails.resources = totalResources;

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

interface IGenerateMetadata {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params, searchParams }: IGenerateMetadata, parent: any): Promise<any> {
  const eventId = params?.id;
  const eventDetailResponse = await await getEventDetailBySlug(eventId, '');
  if (eventDetailResponse?.isError) {
    return {
      title: 'Protocol Labs Directory',
      description:
        'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
      openGraph: {
        images: [
          {
            url: `https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`,
            width: 1280,
            height: 640,
            alt: 'Protocol Labs Directory',
            type: 'image/jpeg',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        images: [`https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`],
      },
    };
  }
  const previousImages = (await parent).openGraph?.images ?? [];
  return {
    title: `${eventDetailResponse?.name} | Protocol Labs Directory`,
    openGraph: {
      type: 'website',
      url: `${process.env.APPLICATION_BASE_URL}${PAGE_ROUTES.IRL}/${eventId}`,
      images: [eventDetailResponse?.bannerUrl, ...previousImages],
    },
  };
}
