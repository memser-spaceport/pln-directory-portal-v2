'use client';

/**
 * SignUpHeader component renders the header section for the sign-up page.
 *
 * This component includes a title and a subtitle, styled with CSS-in-JS using
 * styled-jsx. The header has a background image and adjusts its layout based
 * on the screen size using media queries.
 *
 * @returns {JSX.Element} The rendered header component.
 */
const SignUpHeader = () => {
  return (
    <>
      <header className="sign-up-header">
        <div className="sign-up-header__title">Join the Protocol Labs Network</div>
        <p className="sign-up-header__subtitle">Tell us about yourself</p>
      </header>
      <style jsx>{`
        .sign-up-header {
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
          .sign-up-header {
            background-image: url('/images/join/header-bg.png');
          }
        }
        .sign-up-header__title {
          font-size: 24px;
          font-weight: 700;
          line-height: 29.05px;
          text-align: left;
        }
        .sign-up-header__subtitle {
          font-size: 14px;
          font-weight: 400;
          line-height: 24px;
        }
      `}</style>
    </>
  );
};

export default SignUpHeader;
