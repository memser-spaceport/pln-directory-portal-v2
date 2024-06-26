"use client";

export const RaisingFunds = () => {
  return (
    <>
      <div className="raising-funds">
        <div className="raising-funds__icon-section">
          <div className="raising-funds__icon__section__icon"></div>
        </div>
        <p className="raising-funds__content">Raising Funds</p>
      </div>

      <style jsx>
        {`
          .raising-funds {
            background: #F1F5F9;
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 1px 8px 1px 0;
            border-radius: 56px;
          }

          .raising-funds__content {
            font-size: 12px;
            color: #475569;
            font-weight: 500;
            margin: 0p 200px 0 0;
          }

          .raising-funds__icon-section {
            display: flex;
            border-radius: 100%;
            justify-content: center;
            align-items: center;
            border: 1px solid #e2e8f0;
            background: linear-gradient(119.86deg, #ffbf42 16.03%, #ffa63d 83.85%);
          }

          .raising-funds__icon__section__icon {
            background: url("/icons/funding.svg");
            background-size: cover;
            height: 12px;
            width: 12px;
            margin: auto;
            background-repeat: no-repeat;
          }

          @media(min-width: 1024px) {
            .raising-funds {
                padding: 4px 8px;
                border-radius: 24px;
                background: #FFEAC1;
            }

            .raising-funds__icon-section {
                height: 12px;
                width: 12px;
            }

            .raising-funds__content {
                font-weight: 600;
                color: #D87705;
            
            }
            .raising-funds__icon__section__icon {
                background: url("/icons/fund-raising-orange.svg");
                background-size: contain;
                height: 12px;
                margin: auto;
                width: 12px;
                background-repeat: no-repeat;
              }

              .raising-funds__icon-section {
                background: unset;
          }
          .raising-funds__icon-section {
            border: none;
          }
        `}
      </style>
    </>
  );
};
