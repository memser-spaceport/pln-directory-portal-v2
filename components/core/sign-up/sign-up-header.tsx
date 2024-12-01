'use client'
const SignUpHeader = () => {
  return (
    <>
      <header className="container">
        <div className="container__title">Join the Protocol Labs Network</div>
        <p className="container__subtitle">Tell us about yourself</p>
      </header>
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding: 24px;
          color: #ffffff;
          background-image: url('/images/join/header-bg.png');
          background-size: cover;
          background-position: right;
          height: 100%;
          width: 100%;
          gap: 8px;
        //   background-color: linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 100%);
        }
        @media (min-width: 768px) {
        background-image: url('/images/join/header-bg.png');
      }
        .container__title {
          font-size: 24px;
          font-weight: 700;
          line-height: 29.05px;
          text-align: left;
        }
        .container__subtitle {
          font-size: 14px;
          font-weight: 400;
          line-height: 24px;
        }
      `}</style>
    </>
  );
};

export default SignUpHeader;
