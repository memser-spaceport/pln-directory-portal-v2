'use client'
import { useState } from "react";

interface IAbout {
  about: string
}
const About = (props: IAbout) => {
  const aboutContent = props?.about;
  const [about, setAbout] = useState(aboutContent.substring(0, 350));

  const onShowMoreClickHandler = () => {
    setAbout(aboutContent);
  };

  const onShowLessClickHandler = () => {
    setAbout(about?.substring(0, 350));
  };
  return (
    <>
      {about && (
        <div className="about">
          <h2 className="about__title">About</h2>
          <div className="about__content">
            <div dangerouslySetInnerHTML={{__html: about}}></div>
            {aboutContent?.length > about?.length && (
              <span>
                ...
                <button className="about__content__show-more" onClick={onShowMoreClickHandler}>
                  Show more
                </button>
              </span>
            )}
            {aboutContent?.length > 350 && aboutContent === about && (
              <span>
                &nbsp;
                <button className="about__content__show-less" onClick={onShowLessClickHandler}>
                  Show less
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      <style jsx>
        {`
          .about {
            display: flex;
          }

          .about {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .about__title {
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          .about__content {
            color: #0f172a;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e2e8f0;
          }

          .about__content__show-more {
            color: #156ff7;
            font-size: 15px;
            font-weight: 600;
            line-height: 24px;
            padding: 0;
            border: none;
            background-color: #fff;
          }

          .about__content__show-less {
            color: #156ff7;
            font-size: 15px;
            font-weight: 600;
            line-height: 24px;
            padding: 0;
            border: none;
            background-color: #fff;
          }
        `}
      </style>
    </>
  );
};

export default About;
