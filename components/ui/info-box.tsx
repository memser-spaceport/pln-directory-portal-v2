
interface InfoBoxProps {
    info: string,
    moreInfo?: string,
    imgUrl?: string
}
function InfoBox({info, imgUrl, moreInfo}: InfoBoxProps) {
  return (
    <>
      <div className="infobox">
        {imgUrl && <img src={imgUrl} className="infobox__img" />}
        <p className="infobox__info">{info}</p>
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
