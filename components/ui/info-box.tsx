/**
 * Props for the InfoBox component.
 * @property info - The main info text to display.
 * @property moreInfo - Optional additional info text.
 * @property imgUrl - Optional image URL to display.
 */
interface InfoBoxProps {
    info: string,
    moreInfo?: string,
    imgUrl?: string
}

/**
 * InfoBox component displays a styled information box with optional image and more info.
 * @param info - The main info text to display.
 * @param imgUrl - Optional image URL to display.
 * @param moreInfo - Optional additional info text.
 */
function InfoBox({info, imgUrl, moreInfo}: InfoBoxProps) {
  return (
    <>
      <div className="infobox">
        {/* Optional image */}
        {imgUrl && <img src={imgUrl} className="infobox__img" />}
        {/* Main info text */}
        <p className="infobox__info">{info}</p>
        {/* Optional more info text */}
        {moreInfo && <p className="infobox__moreinfo">{moreInfo}</p>}
      </div>
      <style jsx>
        {`
          .infobox {
            background: #f1f5f9;
            width: fit-content;
            border-radius: 4px;
            height: 22px;
            color: #156ff7;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            padding: 0 8px;
            gap: 8px;
          }
           
          .infobox__moreinfo {
           color: #64748B;
           padding-left: 8px;
           border-left: 1px solid lightgrey;
           font-size: 12px;
          }
        `}
      </style>
    </>
  );
}

export default InfoBox
