
import { useTeamAnalytics } from "@/analytics/teams.analytics";
import Modal from "@/components/core/modal";
import { Tooltip } from "@/components/core/tooltip/tooltip";
import { IUserInfo } from "@/types/shared.types";
import { ITeam } from "@/types/teams.types";
import { getAnalyticsTeamInfo, getAnalyticsUserInfo } from "@/utils/common.utils";
import { TECHNOLOGIES } from "@/utils/constants";
import Image from "next/image";
import { Fragment, useRef, useState } from "react";

interface ITechnologies {
  technologies: { name: string; url: string | undefined }[];
  userInfo: IUserInfo | undefined | null;
  team: ITeam | undefined;
}

const Technologies = (props: ITechnologies) => {
  const userInfo = props?.userInfo;
  const team = props?.team;
  const technologies = props?.technologies ?? [];
  const [isTechnologyPopup, setIsTechnologyPopup] = useState(false);
  const analytics = useTeamAnalytics();
  const allTechnologiesRef = useRef<HTMLDialogElement>(null);

  const onTechnologiesCountClickHandler = () => {
    analytics.onTeamDetailShowMoreTechnologiesClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
    if(allTechnologiesRef?.current) {
    allTechnologiesRef.current.showModal();
    }
  };

  const onClose = () => {
    if (allTechnologiesRef.current) {
      allTechnologiesRef.current.close();
    }
  };
  return (
    <>
      {technologies?.length !== 0 && (
        <div className="technology-container">
          <h2 className="technology-container__title">Technologies</h2>
          <div className="technology-container__technologies">
            {technologies?.map((technology, index: number) => (
              <Fragment key={`${technology} + ${index}`}>
                {TECHNOLOGIES.includes(technology?.name) && index < 3 && (
                  <Tooltip
                    asChild
                    trigger={
                      <div className="technology-container__technologies__technology">
                        <img loading="lazy" alt="technology-container" className="technology-container__technologies__technology__logo" src={technology?.url}></img>
                      </div>
                    }
                    content={technology?.name}
                  />
                )}
              </Fragment>
            ))}
            {technologies?.length > 3 && <button className="technology-container__technologies__count" onClick={onTechnologiesCountClickHandler}>{`+${technologies?.length - 3}`}</button>}
          </div>
        </div>
      )}
        <Modal onClose={onClose} modalRef={allTechnologiesRef}>
          <div className="technologies-popup">
            <h2 className="technologies-popup__title">Technologies</h2>
            {technologies?.map((Technology, index: number) => (
              <div key={`${Technology} + ${index + 1}`} className="technologies-popup__technology">
                <div className="technologies-popup__technology__logo-container">
                  <Image loading="lazy" alt="technology" src={Technology?.url ?? ""} height={24} width={24} />
                </div>
                <p className="technologies-popup__technology__name">{Technology?.name}</p>
              </div>
            ))}
          </div>
        </Modal>
      <style jsx>
        {`
          .technology-container {
            display: flex;
            justify-content: space-between;
            height: 40px;
            align-items: center;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0; 
          }

          .technology-container__title {
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          .technology-container__technologies__technology {
            width: 40px;
            height: 40px;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            align-items: center;
            justify-content: center;
            display: flex;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .technology-container__technologies {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .technology-container__technologies__technology__logo {
            height: 24px;
            width: 24px;
          }

          .technology-container__technologies__count {
            width: 40px;
            height: 40px;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            align-items: center;
            justify-content: center;
            display: flex;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
            color: #156ff7;
            font-size: 16px;
            font-weight: 400;
            line-height: 14px;
            background: #fff;
          }

          .technologies-popup {
            max-height: 100dvh;
            overflow: auto;
            background: #fff;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            border-radius: 12px;
            min-width: 300px;
          }

          .technologies-popup__title {
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
            padding: 10px 0 10px 0;
          }

          .technologies-popup__technology {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .technologies-popup__technology__logo-container {
            height: 40px;
            width: 40px;
            border-radius: 24px;
            border-radius: 1px solid #e2e8f0;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 1px 2px 0px rgba(15, 23, 42, 0.12);
          }

          .technologies-popup__technology__name {
            color: #0f172a;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }
        `}
      </style>
    </>
  );
};

export default Technologies;
