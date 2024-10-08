"use client"

const IrlHeader = () => {
  console.log("HEADER");
    return (
        <>
            <div className="irlheaderCnt">
                <div className="irlHeader">IRL Gatherings</div>
                <div className="irlsubHeader">Choose a destination to view upcoming gathering, attendees, resources & let the network know about your presence</div>
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
                  line-height: 28px;
                }

                @media (min-width: 360px) {
                  .irlheaderCnt{
                    padding: 15px;
                  }
                }
        `}</style>
        </>
    )
}

export default IrlHeader;