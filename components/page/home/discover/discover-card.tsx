const DiscoverCard = (props: any) => {
  const data = props.data;

  return (
    <>
      <div className="discover-card">
        <div className="discover-card__pattern">
          <picture>
            <source media="(max-width: 1024px)" srcSet={data.image?.mob} />
            <img className="discover-card__pattern__img" src={data.image?.desktop} alt="pattern" />
          </picture>
        </div>
        <div className="discover-card__qus">{data.question}</div>
        <div className="discover-card_chips">
          <div className="discover-card_chips_chip">
            <img src="/icons/eye-gray.svg" alt="views" />
            <span className="discover-card_chips_chip__txt">{data.viewCount}</span>
          </div>
          <div className="discover-card_chips_chip">
            <img src="/icons/share-gray.svg" alt="share" />
            <span className="discover-card_chips_chip__txt">{data.shareCount}</span>
          </div>
          <div className="discover-card_chips_chip">
            <img src="/icons/language-gray.svg" alt="sources" />
            <span className="discover-card_chips_chip__txt">{data?.answerSourceLinks?.length} sources</span>
          </div>
        </div>
      </div>
      <style jsx>{`
        .discover-card {
          position: relative;
          z-index: 1;
          padding: 16px;
          height: 100%;
          width: 100%;
          background: #ffffff;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          box-shadow: 0px 4px 4px 0px #0f172a0a, 0px 0px 1px 0px #0f172a1f;
          border: 1px solid #e2e8f0;
          justify-content: space-between;
          gap: 14px;
        }

        // .discover-card:hover {
        //   box-shadow: 0px 0px 0px 2px #156ff740;
        // }

        .discover-card__pattern {
          display: flex;
          justify-content: end;
          position: absolute;
          z-index: -1;
          top: 0;
          right: 0;
        }

        .discover-card__pattern__img {
          border-radius: 0px 12px 0px 0px;
        }

        .discover-card__qus {
          font-size: 14px;
          font-weight: 400;
          line-height: 22px;
          color: #000000;
          max-height: 224px;
          text-overflow: ellipsis;
          white-space: normal;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          word-break: break-word;
        }

        .discover-card_chips {
          display: flex;
          gap: 5px;
          justify-content: start;
          flex-wrap: wrap;
        }

        .discover-card_chips_chip {
          background: #f1f5f9;
          display: inline-flex;
          gap: 4px;
          align-items: center;
          padding: 6px;
          border-radius: 24px;
        }

        .discover-card_chips_chip__txt {
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          color: #475569;
        }

        @media (min-width: 1024px) {
          .discover-card__qus {
            font-size: 23px;
            line-height: 32px;
            -webkit-line-clamp: 7;
          }

          .discover-card {
            padding: 20px;
            gap: 17px;
          }

          //   .discover__body__sec2__child1 {
          //     min-height: 247px;
          //     max-height: 310px;
          //     padding: 20px;
          //     gap: 17px;
          //   }

          .discover-card_chips {
            right: 20px;
            bottom: 20px;
            justify-content: end;
            gap: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default DiscoverCard;
