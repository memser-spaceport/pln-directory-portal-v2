'use client';

export const RaisingFunds = () => {
  return (
    <>
      <div className="raising-funds_mob">
        <img src="/icons/raising-funds-mobile.svg" height={21} width={21} alt="raising funds" />
      </div>
      <div className="raising-funds_web">
        <div className="raising-funds_web__icon-section">
          <div className="raising-funds_web__icon__section__icon"></div>
        </div>
        <p className="raising-funds_web__content">Raising Funds</p>
      </div>

      <style jsx>
        {`

          .raising-funds_web {
            display: none;
          }

          .raising-funds_mob {
            height: 20px;
          }

          @media (min-width: 1024px) {
            .raising-funds_mob {
              display: unset;
            }

            .raising-funds_mob {
            display: none;}

            .raising-funds_web {
              background: #f1f5f9;
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 1px 8px 1px 0;
              border-radius: 56px;
            }

            .raising-funds_web__content {
              font-size: 12px;
              color: #475569;
              font-weight: 500;
              margin: 0p 200px 0 0;
            }

            .raising-funds_web__icon-section {
              display: flex;
              border-radius: 100%;
              justify-content: center;
              align-items: center;
              border: 1px solid #e2e8f0;
              background: linear-gradient(119.86deg, #ffbf42 16.03%, #ffa63d 83.85%);
            }

            .raising-funds_web__icon__section__icon {
              background: url('/icons/funding.svg');
              background-size: cover;
              height: 12px;
              width: 12px;
              margin: auto;
              background-repeat: no-repeat;
            }
            .raising-funds_web {
              padding: 4px 8px;
              border-radius: 24px;
              background: #ffeac1;
            }

            .raising-funds_web__icon-section {
              height: 12px;
              width: 12px;
            }

            .raising-funds_web__content {
              font-weight: 600;
              color: #d87705;
            }
            .raising-funds_web__icon__section__icon {
              background: url('/icons/fund-raising-orange.svg');
              background-size: contain;
              height: 12px;
              margin: auto;
              width: 12px;
              background-repeat: no-repeat;
            }

            .raising-funds_web__icon-section {
              background: unset;
            }
            .raising-funds_web__icon-section {
              border: none;
            }
          }
        `}
      </style>
    </>
  );
};
