"use client";
import { PAGE_ROUTES } from "@/utils/constants";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const IrlErrorPage = () => {

    const router = useRouter();
    
    useEffect(() => {
        router.refresh();
    }, [])

    return (
        <>
            <div className="error-container">
                <div className="error-container__content">
                    <div className="error-container__content__notfoundcontainer">
                        <img loading="lazy" className="error-container__content__notfound-img" alt="error" src="/icons/irl-not-found.svg" />
                    </div>
                    <div className="error-container__content__message">
                        <h2 className="error-container__content__message__title">Oops, you&apos;ve wandered off the map!!</h2>
                        <p className="error-container__content__message__desc">
                            Looks like you&apos;re trying to explore a location not in our listings. Click the button below to take you where the action is!
                        </p>
                        <a href={PAGE_ROUTES.IRL} className="error-container__content__message__back-to-home">Back to IRL Gatherings</a>
                    </div>
                </div>
            </div>

            <style jsx>
                {`
            .error-container {
                position: fixed;
                top: 40px;
                width: 100vw;
                height: 100dvh;
                display: flex; 
                background: #F1F5F9;
                align-items:center;
                justify-content: center;
            }

            .error-container__content {
                display: flex;
                width: 377px;
                color: #fff;
                flex-direction: column;
                gap: 10px;
            }

            .error-container__content__message__title {
              color: #000;
            }

            .error-container__content__notfoundcontainer {
                display: flex;
                justify-content: center;
            }

            .error-container__content__notfound-img {
                
            }

            .error-container__content__message {
                display: flex;
                width: 377px;
                font-size: 14px;
                line-height: 20px;
                text-align: center;
                flex-direction: column;
                color: #000;
                gap: 16px;
                font-weight: 400;
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
                line-height: 40px;
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

            @media(min-width: 360px) {
                .error-container__content__notfoundcontainer {
                    height: 160.65px;
                }

                .error-container__content__message  {
                    padding: 0px 20px 0px 20px;
                }
            }

            @media(min-width: 1024px) {
                .error-container__content__notfoundcontainer {
                    height: 232px;
                }

                .error-container__content__message__title {
                    font-size: 26px;
                    line-height: 31px;
                }
            }
            .`}
            </style>
        </>
    );
};

export default IrlErrorPage;
