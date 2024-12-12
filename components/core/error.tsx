"use client";
import { PAGE_ROUTES } from "@/utils/constants";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Error = () => {
  
  const router = useRouter();
    
  useEffect(() => {
      router.refresh();
  }, [])

  return (
    <>
      <div className="error-container">
        <div className="error-container__content">
          <div className="error-container__content__notfoundcontainer">
            <img  loading="lazy" className="error-container__content__notfound-img" alt="error" src="/icons/notfound.svg" />
          </div>
          <div className="error-container__content__message">
            <h2 className="error-container__content__message__title">Oh snap! Something went wrong!</h2>
            <p className="error-container__content__message__desc">
              The page you&apos;re looking for doesn&apos;t exists or has been removed. Please try searching on the&nbsp;
              <a href={PAGE_ROUTES.TEAMS} className="error-container__content__message__desc__link">
                teams
              </a>
              &nbsp;or&nbsp;
              <a href={PAGE_ROUTES.MEMBERS} className="error-container__content__message__desc__link">
                people
              </a>
              &nbsp;or&nbsp;
              <a href={PAGE_ROUTES.PROJECTS} className="error-container__content__message__desc__link">
                projects
              </a>
              &nbsp;or&nbsp;
              <a href={PAGE_ROUTES.IRL} className="error-container__content__message__desc__link">
                irl-gatherings
              </a>{" "}
              pages.
            </p>
            <a href={PAGE_ROUTES.HOME} className="error-container__content__message__back-to-home">Back to Home </a>
          </div>
        </div>
      </div>

      <style jsx>
        {`
            .error-container {
                position: fixed;
                top: 0;
                width: 100vw;
                height: 100dvh;
                display: flex; 
                background: #F1F5F9;
                align-items:center;
                justify-content: center;
            }

            .error-container__content {
                display: flex;
                width: 320px;
                color: #fff;
                flex-direction: column;
                gap: 10px;
            }

            .error-container__content__message__title {
              color: #000;
            }

            .error-container__content__notfoundcontainer {
                height: 112px;
            }

            .error-container__content__notfound-img {
                
            }

            .error-container__content__message {
                display: flex;
                width: 320px;
                font-size: 14px;
                line-height: 20px;
                text-align: center;
                flex-direction: column;
                color: #000;
                gap: 16px;
            }

            .error-container__content__message__back-to-home {
              padding: 9px 24px;
              border: none;
              background: #156FF7;
              font-size: 14px;
              font-weight: 600;
              line-height: 20px;
              color: #fff;
              margin: auto;
              border-radius: 24px;
              width: fit-content;
            }

            .error-container__content__message__title {
                color: #0F172A;
                text-align: center;
                font-size: 26px;
                font-weight: 700;
                line-height: 32px;
            }

            . error-container__content__message__desc {
                color: #000;
                text-align: center;
                font-size: 14px;
                font-weight: 400;
                line-height: 20px;
            }

            .error-container__content__message__desc__link {
                color:  #156FF7;
                font-size: 14px;
                font-weight: 500;
                line-height: 20px;
            }

            @media(min-width: 1024px) {
            .error-container__content__message__title {
                font-size: 32px;
            }
            }
            .`}
      </style>
    </>
  );
};

export default Error;
