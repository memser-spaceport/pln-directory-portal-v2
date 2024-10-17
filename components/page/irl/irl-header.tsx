"use client"

const IrlHeader = () => {
    return (
        <>
            <div className="irlheaderCnt">
                <div className="irlHeader">IRL Gatherings</div>
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

                @media (min-width: 360px) {
                  .irlheaderCnt{
                    padding: 15px;
                  }

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