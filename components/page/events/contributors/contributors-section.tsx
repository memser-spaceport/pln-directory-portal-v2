'use client';

import MembersList from '@/components/page/events/contributors/members-list';
import { Treemap as TeamsTreemap } from '@/components/core/events/treemap';
import { ResponsiveContainer } from '@/components/core/events/treemap';
import { Tooltip } from '@/components/core/events/treemap';
import { ChartTooltip } from '@/components/core/events/treemap';
import { TreemapCustomContent } from '@/components/core/events/treemap';
import ShadowButton from '@/components/ui/ShadowButton';
import Link from 'next/link';
import { useEventsAnalytics } from '@/analytics/events.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import Modal from '@/components/core/modal';
import { useRef } from 'react';
import { PAGE_ROUTES, CONTRIBUTE_MODAL_VIDEO_URL } from '@/utils/constants';

interface ContributorsSectionProps {
  members?: any[];
  teams?: any[];
  title?: string;
  subtitle?: string;
  guestImg?: string;
  treemapConfig?: {
    backgroundColor?: string;
    borderColor?: string;
    height?: number;
  };
  userInfo?: any;
}

export default function ContributorsSection({
  members = [],
  teams = [],
  treemapConfig = {
    backgroundColor: '#E5F7FF',
    borderColor: '#ffffff',
    height: 400,
  },
  userInfo,
}: ContributorsSectionProps) {
  const { onContributeButtonClicked, onContributtonModalCloseClicked, onContributeModalIRLProceedButtonClicked } =
    useEventsAnalytics();
  const contributeRef = useRef<HTMLDialogElement>(null);
  const onCloseModal = () => {
    if (contributeRef.current) {
      contributeRef.current.close();
    }
    onContributtonModalCloseClicked();
  };

  const openContributeModal = () => {
    if (contributeRef.current) {
      contributeRef.current.showModal();
    }
    onContributeButtonClicked();
  };
  return (
    <div id="contributors" className={`contributors-container`}>
      <div className="contributors-section-container">
        <div className="contributors-header">
          <div>
            <h1 className="contributors-title"> Contributors</h1>
            <p className="contributors-subtitle">Hosts & Speakers</p>
          </div>
          <ShadowButton
            buttonColor="#156FF7"
            shadowColor="#3DFEB1"
            buttonWidth="121px"
            onClick={() => {
              openContributeModal();
            }}
          >
            Contribute
          </ShadowButton>
        </div>

        <div className="section-container">
          <MembersList members={members} userInfo={userInfo} />
        </div>
      </div>

      <div className="section-container teams-section-container">
        <div
          style={{
            height: treemapConfig.height,
            backgroundColor: treemapConfig.backgroundColor,
            width: '100%',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <TeamsTreemap
              data={teams.map((team) => ({
                name: team.name,
                size: team.hosts + team.speakers,
                speakers: team.speakers,
                hosts: team.hosts,
                logo: team.logo,
                uid: team.uid,
              }))}
              dataKey="size"
              content={<TreemapCustomContent />}
              fill={treemapConfig.backgroundColor}
            >
              <Tooltip content={ChartTooltip} />
            </TeamsTreemap>
          </ResponsiveContainer>
        </div>
      </div>

      <Modal modalRef={contributeRef} onClose={onCloseModal}>
        <div className="contribute-modal-container">
          <div className="contribute-modal-header">Ways to contribute</div>
          <div className="contribute-modal-video-container">
            <video
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '100%', height: 'auto', pointerEvents: 'none', borderRadius: '10px' }}
              className="contribute-modal-video"
              controls={false}
            >
              <source src={CONTRIBUTE_MODAL_VIDEO_URL} type="video/webm" />
              Your browser does not support this video.
            </video>
          </div>
          <div className="contribute-modal-content">
            <div className="contribute-modal-content-description">
              IRL Gatherings thrive when community members contribute in different ways! Here&apos;s how you can be a
              part of it.
            </div>
            <div className="contribute-modal-content-list">
              <div className="contribute-modal-content-list-item sponsor">
                <span className="contribute-modal-content-list-item-icon">
                  <img src="/icons/sponsor_icon.svg" alt="Contribute to a gathering" />
                  <span>
                    Sponsor <span className="desktop-view"> -</span>
                  </span>
                </span>
                <div className="contribute-modal-content-list-item-title">
                  Help make it happen by offering support or resources.
                </div>
              </div>
              <div className="contribute-modal-content-list-item speaker">
                <span className="contribute-modal-content-list-item-icon">
                  <img src="/icons/host_icon.svg" alt="Contribute to a gathering" />
                  <span>
                    Host <span className="desktop-view"> -</span>
                  </span>
                </span>
                <div className="contribute-modal-content-list-item-title">
                  Plan or organize a gathering for the community.
                </div>
              </div>
              <div className="contribute-modal-content-list-item host">
                <span className="contribute-modal-content-list-item-icon">
                  <img src="/icons/speaker_icon.svg" alt="Contribute to a gathering" />
                  <span>
                    Speaker <span className="desktop-view"> -</span>
                  </span>
                </span>
                <div className="contribute-modal-content-list-item-title">
                  Share insights and expertise by speaking at an event.
                </div>
              </div>
              <div className="contribute-modal-content-list-item attendee">
                <span className="contribute-modal-content-list-item-icon">
                  <img src="/icons/attendee_icon.svg" alt="Contribute to a gathering" />
                  <span>
                    Attendee <span className="desktop-view"> -</span>
                  </span>
                </span>
                <div className="contribute-modal-content-list-item-title">
                  Be part of the experience and engage with others.
                </div>
              </div>
            </div>
          </div>
          <div className="contribute-modal-content-description">
            Once you land on IRL Gatherings, Click “I&apos;m Going” & choose how you&apos;d like to contribute and help
            make these gatherings valuable for everyone!
          </div>
          <div className="contribute-modal-content-button">
            <button className="contribute-modal-content-button-cancel" onClick={onCloseModal}>
              Cancel
            </button>
            <button
              className="contribute-modal-content-button-proceed"
              onClick={() => {
                onContributeModalIRLProceedButtonClicked();
                window.open(PAGE_ROUTES.IRL);
              }}
            >
              Continue to IRL Gatherings
            </button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .contributors-container {
          width: 100%;
        }

        .contributors-section-container {
          padding: 20px;
          background: #ffffff;
        }

        .contributors-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .contributors-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }

        .contribute-modal-video {
          outline: 1px solid #e1e3e6;
          border-radius: 10px;
        }

        .section-title-members {
          background-color: #e8f2ff;
        }

        .section-title-teams {
          background-color: #e0fff3;
        }

        .contribute-modal-content-list-item-icon {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .teams-section-container {
          padding: 20px;
          border-top: 1px solid #e2e8f0;
          background: #ffffff;
          margin-top: 20px;
        }

        .contributors-subtitle {
          font-size: 16px;
          margin: 4px 0 0 0;
          color: #666;
        }

        .contribute-modal-content {
          // width: 100%;
          // height: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .contribute-modal-content-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          // flex-wrap: wrap;
          font-weight: 600;
          font-size: 15px;
          line-height: 20px;
        }

        .contribute-modal-content-list-item {
          display: flex;
          align-items: flex-start;
          flex-direction: column;
          gap: 10px;
          padding: 8px;
          border-radius: 10px;
          font-weight: 400;
          font-size: 14px;
          line-height: 20px;
        }

        .contribute-modal-content-description {
          font-weight: 400;
          font-size: 14px;
          line-height: 20px;
          letter-spacing: 0px;
        }

        .host {
          border: 1px solid #48b8bd;
        }

        .speaker {
          border: 1px solid #d18aff;
        }

        .sponsor {
          border: 1px solid #8aabff;
        }

        .attendee {
          border: 1px solid #438dee;
        }

        .contribute-modal-content-title {
          font-weight: 600;
          font-size: 15px;
          line-height: 20px;
        }

        .contribute-modal-content-button {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
          flex-direction: column-reverse;
        }

        .contribute-modal-content-button-cancel {
          background-color: #ffffff;
          color: #000000;
          border: 1px solid #000000;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 500;
          width: 100%;
          cursor: pointer;
        }

        .contribute-modal-content-button-proceed {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 500;
          width: 100%;
          cursor: pointer;
        }

        .collaborate-button {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 5px 0 #3dfeb1;
          transition: all 0.2s ease;
        }

        .collaborate-button:hover {
          transform: translateY(-2px);
        }

        .section-container {
          margin-bottom: 10px;
        }

        .section-title {
          display: inline-block;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 20px;
        }

        .contribute-modal-container {
          display: flex;
          flex-direction: column;
          width: 85vw;
          max-height: 85dvh;
          min-height: 30vh;
          overflow-y: auto;
          padding: 0;
          gap: 10px;
        }

        .contribute-modal-header {
          font-weight: 700;
          font-size: 24px;
          line-height: 32px;
          display: flex;
          gap: 8px;
          padding: 15px 15px 8px;
          position: sticky;
          top: 0;
          background: #fff;
          z-index: 0;
        }

        .contribute-modal-video-container,
        .contribute-modal-content,
        .contribute-modal-content-description,
        .contribute-modal-content-button {
          padding-inline: 15px;
        }

        .contribute-modal-content-button {
          padding-bottom: 15px;
        }

        .desktop-view {
          display: none;
        }

        @media (max-width: 768px) {
          .contributors-header {
            flex-direction: row;
            align-items: flex-start;
            gap: 16px;
          }

          .contributors-title {
            font-size: 24px;
          }

          .contributors-subtitle {
            font-size: 14px;
          }

          .collaborate-button {
            align-self: flex-start;
          }
        }

        @media (min-width: 1024px) {
          .teams-section-container {
            margin-top: unset;
          }

          .contribute-modal-container {
            width: 537px;
            gap: 20px;
          }

          .contribute-modal-header {
            padding: 24px 24px 8px;
          }

          .contribute-modal-video-container,
          .contribute-modal-content,
          .contribute-modal-content-description,
          .contribute-modal-content-button {
            padding-inline: 24px;
          }

          .contribute-modal-content-button {
            padding-bottom: 24px;
          }

          .contribute-modal-content-list-item {
            flex-direction: row;
            align-items: flex-start;
          }

          .contribute-modal-content-button-proceed,
          .contribute-modal-content-button-cancel {
            width: unset;
          }

          .contribute-modal-content-button {
            flex-direction: row;
          }

          .mobile-view {
            display: none;
          }

          .desktop-view {
            display: inline;
          }
        }
      `}</style>
    </div>
  );
}
