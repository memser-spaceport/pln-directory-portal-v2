interface IVerifyEmailModalProps {
  handleModalClose: () => void;
  description: string;
  title: string;
}

export function VerifyEmailModal({ description, title, handleModalClose }: IVerifyEmailModalProps) {
  return (
    <>
      <div className="verifyEmail">
        <div className="verifyEmail__cn">
          <div className="verifyEmail__cn__box">
            <div className="verifyEmail__cn__box__info">
              <h2 className="verifyEmail__cn__box__info__title">
                <span className="verifyEmail__cn__box__info__title__logo">
                  <img
                    width={22}
                    height={22}
                    className="verifyEmail__cn__box__info__title__logo__img"
                    src="/icons/danger.svg"
                    alt="warning"
                  />
                </span>
                {title}
              </h2>
              <p className="verifyEmail__cn__box__info__text">{description}</p>
              <div className="verifyEmail__cn__actions">
                <button onClick={handleModalClose} className="verifyEmail__cn__box__info__btn">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .verifyEmail {
            position: fixed;
            top: 0;
            z-index: 2000;
            right: 0;
            left: 0;
            width: 100svw;
            height: 100svh;
            background: rgb(0, 0, 0, 0.6);
          }
          .verifyEmail__cn {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            position: relative;
            align-items: center;
            justify-content: center;
          }
          .verifyEmail__cn__box {
            width: 90svw;
            background: white;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
          }
          .verifyEmail__cn__box__close {
            display: none;
          }
          .verifyEmail__cn__box__info {
            padding: 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .verifyEmail__cn__box__info__title {
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
            text-align: center;
            display: flex;
            align-items: center;
            flex-direction:column;
            gap: 8px;
          }

          .verifyEmail__cn__box__info__text {
            font-size: 16px;
            font-weight: 400;
            text-align: center;
            line-height: 24px;
            padding-bottom: 16px;
            padding-top: 12px;
          }
          .verifyEmail__cn__box__info__title__logo {
            background: grey;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: #fbe9ee;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .verifyEmail__cn__box__info__title__logo__img {
            margin-bottom: 3px;
          }
          .verifyEmail__cn__actions {
            background: white;
            display: flex;
            align-items: center;
            gap: 10px;
            border-radius: 0 0 8px 8px;
            width: 100%;
            justify-content: center;
          }
          .verifyEmail__cn__actions__cancel {
            padding: 10px 24px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            font-size: 14px;
            font-weight: 500;
          }
          .verifyEmail__cn__actions__login {
            padding: 10px 24px;
            border-radius: 8px;
            background: #156ff7;
            color: white;
            font-size: 14px;
            font-weight: 500;
          }
          .verifyEmail__cn__box__info__btn {
            padding: 8px 24px;
            border-radius: 28px;
            border: 1px solid #156ff7;
            color: #156ff7;
            font-size: 14px;
            font-weight: 500;
            background-color: #ffffff;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 150px;
          }

          @media (min-width: 1024px) {
            .verifyEmail__cn__actions {
              justify-content: end;
            }

            .verifyEmail__cn__box__info__text {
              text-align: left;
              width: 600px;
            }

            .verifyEmail__cn__box__info__title {
              width: 100%;
              flex-direction:row;
            }

            .verifyEmail__cn__box {
              flex-direction: row;
              max-height: 598px;
              width: fit-content;
              overflow: hidden;
            }

            .verifyEmail__cn__box__close {
              position: absolute;
              top: 16px;
              right: 16px;
              display: block;
              cursor: pointer;
              height: 12px;
              width: 12px;
            }
          }
        `}
      </style>
    </>
  );
}
