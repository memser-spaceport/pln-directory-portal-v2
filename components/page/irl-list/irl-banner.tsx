'use client';

import { triggerLoader } from "@/utils/common.utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function IrlBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    triggerLoader(false);
  }, [router, searchParams])
  return (
    <>
      <div className="irlBnr">
        <div className="irlBnr__img">
          <picture>
            <source
              media="(min-width: 1280px)"
              srcSet="/images/irl/irl-header.png"
            />
            <img
              className="irlBnr__img__src"
              src="/images/irl/irl-header-mobile.png"
              alt="IRL Header"
            />
          </picture>
        </div>
        <div className="irlBnr__text">
          <div className="irlBnr__text__cn">
            <h1 className="irlBnr__text__cn__title">
              Enhance Your Event Experience
            </h1>
            <p className="irlBnr__text__cn__desc">
              Explore key network events, find out who will be attending, and
              plan out meetings in advance to get the most out of your time
              together in-person
            </p>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .irlBnr {
            width: 100%;
            height: 100%;
            box-shadow: 0px 0px 1px 0px #0f172a1f;
            position: relative;
          }

          .irlBnr__img {
            height: 100%;
            width: 100%;
          }

          .irlBnr__img__src {
            height: 100%;
            width: 100%;
            object-fit: fill;
            object-position: center;
          }

          .irlBnr__text {
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0 18px;
          }

          .irlBnr__text__cn {
            width: calc(100% - 40px);
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .irlBnr__text__cn__title {
            font-weight: 700;
            font-size: 24px;
            line-height: 29px;
            color: #ffffff;
          }

          .irlBnr__text__cn__desc {
            font-weight: 400;
            font-size: 14px;
            line-height: 24px;
            color: #ffffff;
          }

          @media (min-width: 1024px) {
            .irlBnr__img__src {
              border-radius: 10px;
              object-fit: cover;
            }

            .irlBnr__text__cn__title {
              font-size: 32px;
              line-height: 40px;
            }

            .irlBnr__text__cn__desc {
              width: calc(100% - 250px);
            }
          }
        `}
      </style>
    </>
  );
}
