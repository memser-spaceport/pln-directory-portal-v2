"use client";

interface IKpis {
  kpis: any[];
}

const KPIs = (props: IKpis) => {
  const kpis = props?.kpis;

  return (
    <>
      <div className="kpis">
        <h6 className="kpis__title">KPIs</h6>
        <div className="kpis__container">
          {kpis?.map((kpi: any, index: number) => (
            <div className="kpi" key={`kpi-${index}`}>
              <span className="kpi__value">{kpi.value}</span>
              <span className="kpi__name">{kpi.key}</span>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .kpis {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .kpis__title {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #64748b;
        }

        .kpis__container {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }

        .kpi {
          height: 88px;
          padding: 10px;
          border-radius: 4px;
          border: 1px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 138px;
        }

        .kpi__value {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          letter-spacing: 0px;
          color: #000000;
        }

        .kpi__name {
          font-size: 13px;
          font-weight: 400;
          line-height: 18px;
          letter-spacing: 0px;
          color: #64748b;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        @media (min-width: 1024px) {
          .kpis__container {
            justify-content: unset;
            display: grid;
            grid-auto-columns: minmax(0, 1fr);
            grid-auto-flow: column;
          }

          .kpi {
            width: ${kpis.length === 1 ? "50%" : "unset"};
          }
        }
      `}</style>
    </>
  );
};

export default KPIs;
