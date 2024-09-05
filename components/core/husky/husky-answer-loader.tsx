function HuskyAnswerLoader(props: any) {
  const question = props.question;
  return (
    <>
      <div id="answer-loader" className="husky-loader">
        <div className="husky-loader__ques">
          <h2>{question}</h2>
        </div>
        <div className="husky-loader__sources">
          <div className="husky-loader__ans__line"></div>
        </div>
        <div className="husky-loader__ans">
          <div className="husky-loader__ans__line"></div>
          <div className="husky-loader__ans__line"></div>
          <div className="husky-loader__ans__line"></div>
          <div className="husky-loader__ans__line"></div>
        </div>
        <div className="husky-loader__info">
          <p className="husky-loader__info__text">
            <img className="husky-loader__info__text__icon" src="/icons/husky-bone.svg" />
            <span>Husky is fetching the answer, this might take a while...</span>
          </p>
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
            border-radius: 4px;
            font-size: 14px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 80%;
          }
          .husky-loader__info__text__icon {
            animation: rotate 1s linear infinite;
            width: 20px;
            height: 20px;
          }
          .husky-loader__info {
            width: 100%;
            position: absolute;
            bottom: 20px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
          }

          @media(min-width: 1024px) {
          
           .husky-loader__info__text {
            width:fit-content;
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
