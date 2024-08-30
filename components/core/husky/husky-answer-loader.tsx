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

          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyAnswerLoader;
