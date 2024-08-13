'use client';
function HuskySourceCard() {
  return (
    <>
      <div className="sources">
        <h3 className="sources__title">Sources</h3>
        <div className="sources__item">
          <div className="sources__item__head">
            <p className="sources__item__head__index">1</p>
            <img />
            <p>Protocol Labs</p>
          </div>
          <div className="sources__item__body">Protocol Labs | breakthrough</div>
        </div>
      </div>
      <style jsx>
        {
            `
             .sources {
            width: 327px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 24px;
          }
          .sources__title {
            padding-bottom: 8px;
          }
          .sources__item {
            padding: 8px 10px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .sources__item__head {
            display: flex;
            gap: 4px;
          }
            
            `
        }
      </style>
    </>
  );
}

export default HuskySourceCard;
