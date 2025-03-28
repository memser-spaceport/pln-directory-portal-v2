"use client"

import { PAGE_ROUTES } from "@/utils/constants";

const IrlHeader = () => {

    return (
        <>
            <div className="irlheaderCnt">
              <div className="irlHeaderCntr">
                <a href={PAGE_ROUTES.EVENTS}>
                  <img src="/icons/rounded-left-arrow.svg" alt="Back To Events" />
                </a>
                <div className="irlHeader">IRL Gatherings</div>
              </div>
              <div className="irlsubHeader">Choose a destination to view upcoming gatherings, attendees, resources & let the network know about your presence</div>
            </div>
            <style jsx> {`
                .irlHeader {
                  font-size: 24px;
                  font-weight: 600;
                  line-height: 28px;
                  padding-bottom: 5px
                }
                  
                .irlsubHeader {
                  font-size: 14px;
                  font-weight: 400;
                }

                .irlHeaderCntr {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                }

                .irlheaderCnt{
                    padding: 24px 15px 15px 15px
                }

                @media (min-width: 360px) {

                  .irlsubHeader{
                    line-height: 22px;
                  }
                }

                @media (min-width: 10240px) {
                  .irlsubHeader{
                    line-height: 28px;
;
                  }
                }
        `}</style>
        </>
    )
}

export default IrlHeader;