import { useJoinNetworkAnalytics } from '@/analytics/join-network.analytics';
import { PAGE_ROUTES } from '@/utils/constants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';

/**
 * AddEditTeamSuccess component displays a success message after a user has signed up.
 * It shows an image indicating the profile is under review, a title, a descriptive text,
 * and a button to navigate back to the home page.
 *
 * @component
 * @example
 * return (
 *   <AddEditTeamSuccess />
 * )
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @remarks
 * This component uses the `useRouter` hook from Next.js to handle navigation
 * and a custom `useSignUpAnalytics` hook to record analytics events.
 *
 * @function
 * @name AddEditTeamSuccess
 */
const AddEditTeamSuccess = () => {
  const router = useRouter();
  const analytics = useJoinNetworkAnalytics();

  /**
   * Handles the click event for the "Back to Home" button.
   * Navigates the user to the home page and records the click event for analytics.
   *
   * @returns {void}
   */
  const onBackToHomeClick = () => {
    router.push('/');
    analytics.recordTeamSubmitSuccessHomeClick();
  };

  /**
   * Handles the click event for the "Back to Home" button.
   * Navigates the user to the home page and records the click event for analytics.
   *
   * @returns {void}
   */
  const onSubmitAnotherTeamClick = () => {
    window.location.href = PAGE_ROUTES.ADD_TEAM;
    analytics.recordTeamSubmitSuccessAnotherTeamClick();
  };

  return (
    <>
      <div className="team-submit-success__cn">
        <div>
          <Image src="/images/team/under-review.svg" alt="under-review" width={148} height={148} />
        </div>
        <div className="team-submit-success__cn__info">
          <div className="team-submit-success__cn__info__title">Team Under Review</div>
          <div className="team-submit-success__cn__info__text">Our team will review your request and get back to you shortly</div>
          <div className="team-submit-success__cn__info__action">
            <button className="team-submit-success__cn__info__action__submit" onClick={onSubmitAnotherTeamClick}>
              Submit another Team
            </button>
            <button className="team-submit-success__cn__info__action__back" onClick={onBackToHomeClick}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .team-submit-success__cn {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          background-color: white;
          padding: 32px;
          gap: 32px;
        }

        .team-submit-success__cn__info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          justify-content: center;
          align-items: center;
        }

        .team-submit-success__cn__info__title {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          color: #0f172a;
        }

        .team-submit-success__cn__info__text {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #0f172a;
          text-align: center;
        }

        .team-submit-success__cn__info__action__back {
          padding: 10px 24px 10px 24px;
          gap: 8px;
          border-radius: 8px;
          border: 1px 0px 0px 0px;
          opacity: 0px;
          background-color: #156ff7;
          border: 1px solid #cbd5e1;
          box-shadow: 0px 1px 1px 0px #0f172a14;
          color: #cbd5e1;
        }

        .team-submit-success__cn__info__action__submit {
          padding: 10px 24px 10px 24px;
          gap: 8px;
          border-radius: 8px;
          border: 1px 0px 0px 0px;
          opacity: 0px;
          background-color: white;
          border: 1px solid #cbd5e1;
          box-shadow: 0px 1px 1px 0px #0f172a14;
          color: #0f172a;
        }

        .team-submit-success__cn__info__action {
          display: flex;
          flex-direction: column-reverse;
          gap: 8px;
          padding-top: 10px;
        }

        @media (min-width: 1024px) {
          .team-submit-success__cn {
            flex-direction: row;
            border-radius: 12px;
          }
          .team-submit-success__cn__info {
            justify-content: flex-start;
            align-items: flex-start;
          }
          .team-submit-success__cn__info__action {
            flex-direction: row;
          }
        }
      `}</style>
    </>
  );
};

export default AddEditTeamSuccess;
