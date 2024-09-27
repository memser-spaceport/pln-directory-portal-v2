function HuskyAnswerLoader(props: any) {
  const question = props.question;
  return (
    <>
      <div id="answer-loader" className="husky-loader">
        <div className="husky-loader__ques">
          <h2>{question}</h2>
        </div>
        <div className="huksy-loader__body">
          <div className="husky-loader__sources">
            <div className="husky-loader__ans__line"></div>
          </div>
          <div className="husky-loader__ans">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="husky-loader__ans__line"></div>
            ))}
          </div>
          <div className="husky-loader__info">
            {/* <p className="husky-loader__info__text">
            <img className="husky-loader__info__text__icon" src="/icons/husky-bone.svg" />
            Fetching your response...this may take a moment. Data may be inaccurate due to outdated sources.
          </p> */}

            <div className="husky-loader__info__text--mob">
              <span className="husky-loader__info__text__icon__wrpr">
                <img className="husky-loader__info__text__icon" src="/icons/husky-bone.svg" />
                Fetching your response...
              </span>
              <p>This may take a moment. Please verify sources for accuracy, as responses may sometimes be inaccurate.</p>
            </div>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .husky-loader {
            width: 100%;
            padding: 0 24px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .huksy-loader__body {
            position: relative;
          }

          .husky-loader__sources {
            padding: 16px 0;
          }
          .husky-loader__ans {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 8px; /* Space between the lines */
          }

          .husky-loader__ans__line {
            width: 100%;
            height: 16px; /* Height of each skeleton line */
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            border-radius: 4px;
            animation: shimmer 1.5s infinite;
          }
          .husky-loader__info__text {
            padding: 16px;
            background: #dbeafe;
            color: #1e3a8a;
            box-shadow: 0px 4px 4px 0px #0f172a0a, 0px 0px 1px 0px #0f172a1f;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 12px;
            width: 80%;
            line-height: 22px;
          }

          .husky-loader__info__text--mob {
            padding: 16px;
            background: #dbeafe;
            color: #1e3a8a;
            box-shadow: 0px 4px 4px 0px #0f172a0a, 0px 0px 1px 0px #0f172a1f;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 400;
            display: flex;
            flex-direction: column;
            gap: 4px;
            // align-items: center;
            width: 100%;
            line-height: 22px;
          }

          .husky-loader__info__text__icon__wrpr {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
             font-size: 16px;
          }

          .husky-loader__info__text__icon {
            animation: rotate 1s linear infinite;
            width: 20px;
            height: 20px;
          }
          .husky-loader__info {
            width: 100%;
            position: absolute;
            top: 40px;
            // left: 50%;
            // right: 0;
            transformX: translateX(-50%);
            display: flex;
            justify-content: center;
          }

          @media (min-width: 1024px) {
            .husky-loader__info__text--mob {
              width: 475px;
            }
          }

          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }

          @keyframes rotate {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyAnswerLoader;
