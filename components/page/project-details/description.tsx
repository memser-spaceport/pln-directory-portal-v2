"use client";

import { useState } from "react";

interface IDescription {
  description: string;
}

const Description = (props: IDescription) => {
  const description = props?.description ?? "";
  const [desc, setDesc] = useState(description?.substring(0, 350));

  const onShowMoreClickHandler = () => {
    setDesc(description);
  };

  const onShowLessClickHandler = () => {
    setDesc(desc?.substring(0, 350));
  };

  return (
    <>
      {desc && (
        <div className="desc">
          <h6 className="desc__title">Description</h6>
          <p className="desc__content">
            {desc}
            {description?.length > desc?.length && (
              <span>
                ...
                <button
                  className="desc__content__show-more"
                  onClick={onShowMoreClickHandler}
                >
                  Show more{" "}
                </button>
              </span>
            )}
            {description?.length > 350 && description === desc && (
              <span>
                &nbsp;
                <button
                  className="desc__content__show-less"
                  onClick={onShowLessClickHandler}
                >
                  Show less
                </button>
              </span>
            )}
          </p>
        </div>
      )}
      <style jsx>{`
        .desc {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .desc__title {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #64748b;
        }

        .desc__content {
          font-size: 15px;
          font-weight: 400;
          line-height: 24px;
          letter-spacing: 0em;
          color: #0f172a;
          word-break: break-word;
        }

        .desc__content__show-more {
          color: #156ff7;
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          padding: 0;
          border: none;
          background-color: #fff;
        }

        .desc__content__show-less {
          color: #156ff7;
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          padding: 0;
          border: none;
          background-color: #fff;
        }
      `}</style>
    </>
  );
};

export default Description;
