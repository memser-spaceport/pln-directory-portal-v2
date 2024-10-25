"use client";

import { useProjectAnalytics } from "@/analytics/project.analytics";
import { IUserInfo } from "@/types/shared.types";
import { getAnalyticsUserInfo } from "@/utils/common.utils";


interface IHyperlinks {
  project: any;
  user: IUserInfo;
}

/**
 * A component to display the relavant hyperlinks of a project
 * @param props Project details along with the hyperlinks and the user details
 * @returns a JSX.Element with the hyperlinks
 */

const Hyperlinks = (props: IHyperlinks) => {
  const project = props?.project;
  const links = project?.projectLinks ?? [];
  const user = props?.user;
  const analytics = useProjectAnalytics();

  /**
   * on link click event handler to record the analytics
   * @param link The link that is clicked
   */
  const onLinkClick = (link: string) => {
    analytics.onProjectDetailContactClicked(getAnalyticsUserInfo(user), project?.id, link);
  };

  return (
    <>
      <div className="hyperLinks">
        <h6 className="hyperLinks__title">Links</h6>
        <div className="hyperLinks__container">
          {links.map((link: any, index: number) => (
            <a
              className="hyperLinks__container__link"
              key={`project-link-${index}`}
              href={link?.url}
              target="_blank"
              onClick={() => onLinkClick(link?.url)}
              title={link?.url}
            >
              <img
                width={20}
                height={20}
                src="/icons/hyper-link.svg"
                alt="icon"
              />
              <span className="hyperLinks__container__link__name">
                {link?.name}
              </span>
              <img
                width={10}
                height={10}
                src="/icons/arrow-blue.svg"
                alt="arrow icon"
              />
            </a>
          ))}
        </div>
      </div>
      <style jsx>{`
        .hyperLinks {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hyperLinks__title {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #64748b;
        }

        .hyperLinks__container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hyperLinks__container__link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .hyperLinks__container__link__name {
          font-size: 13px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #156ff7;
          max-width: 250px;
          text-overflow: ellipsis;
          overflow: hidden;
          word-break: break-word;
          white-space: nowrap;
        }

        @media (min-width: 1024px) {
          .hyperLinks__container {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 32px;
          }
        }
      `}</style>
    </>
  );
};

export default Hyperlinks;
