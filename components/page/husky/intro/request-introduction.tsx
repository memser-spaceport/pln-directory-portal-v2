


const RequestIntroduction = (props: any) => {

    const { message } = props;

    const text = message?.toolInvocation?.result?.text;
  
    return (
      <>
        <div className="request-introduction-container">
          <img src="/images/husky/intro-assistant.svg" alt="assistant" className="request-introduction-container__profile-image" />
          <div className="request-introduction-container__text">{text}</div>
        </div>
  
        <style jsx>
          {`
            .request-introduction-container {
              display: flex;
              gap: 20px;
              align-items: start;
              padding: 17px 14px;
              background-color: white;
              border-radius: 8px;
            }
  
            .request-introduction-container__text {
              font-weight: 400;
              font-size: 14px;
              line-height: 22px;
            }
  
            .request-introduction-container__profile-image {
              width: 32px;
              height: 32px;
              border-radius: 50%;
            }
          `}
        </style>
      </>
    );
}

export default RequestIntroduction;
