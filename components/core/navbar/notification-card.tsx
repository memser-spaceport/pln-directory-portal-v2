import { IFollowUp } from '@/types/officehours.types';
import { calculateTime } from '@/utils/common.utils';
import { NOTIFICATION_TYPES } from '@/utils/constants';

interface INotification {
  notification: IFollowUp;
}
const NotificationCard = (props: INotification) => {
  const notification = props?.notification;
  const profile = notification?.interaction?.targetMember?.image?.url ?? '/icons/default_profile.svg';

  const text = getTitle(notification) ?? '';
  const daysAgo = calculateTime(notification?.createdAt);

  function getTitle(notification: any) {
    if (notification?.type === NOTIFICATION_TYPES.meetingInitiated.name) {
      return `Did you schedule Office Hours with ${notification?.interaction?.targetMember?.name}?`;
    } else if(notification?.type === NOTIFICATION_TYPES.meetingScheduled.name || notification?.type === NOTIFICATION_TYPES.meetingRescheduled.name) {
      return `How was your recent meeting with ${notification?.interaction?.targetMember?.name}?`;
    }
  }

  return (
    <>
      <div className="noticrd">
        <div className="noticrd__prflec">
          <img alt="profile" className="noticrd__prflec_prfle" src={profile} height={48} width={48} />
        </div>

        <div className="noticrd__cnt">
          <div className="noticrd__cnt__ttl" dangerouslySetInnerHTML={{ __html: text }}></div>
          <div className='noticrd__cnt__date'>{daysAgo}</div>
        </div>
      </div>

      <style jsx>
        {`
          .noticrd {
            padding: 16px 12px;
            display: flex;
            gap: 10px;
          }

          .noticrd__prflec_prfle {
            border-radius: 50%;
            object-fit: cover;
          }

          .noticrd__cnt {
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .noticrd__cnt__ttl {
            font-size: 14px;
            line-height: 20px;
            font-weight: 400;
          }

          .noticrd__cnt__date {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #64748B;
          }


        `}
      </style>
    </>
  );
};

export default NotificationCard;
