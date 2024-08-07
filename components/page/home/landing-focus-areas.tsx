'use client';

const LandingFocusAreas = (props: any) => {
  const focusAreas = props?.focusAreas;

  console.log('focus is', focusAreas);

  return (
    <>
      <div className="lfa">
        <div className="lfa__titlesec">
          <img height={28} width={28} src="/icons/hexagon-wheels.svg" />
          <h2 className="lfa__titles__ttl">Focus Areas</h2>
        </div>

        <div className="lfa__descsec">
          <p className="lfa__descsec__desc">Protocol Labs’s vision for the future is built on four core focus areas that aim to harness humanity’s potential for good, navigate potential pitfalls, and ensure a future where technology empowers humanity.</p>
        </div>

        <div className="lfa__focusareas">
          {focusAreas?.teamFocusAreas.map((focusArea: any, index: number) => {
            const image = `/icons/${focusArea?.title?.toLowerCase()}.svg`;
            return (
              <div style={{background: `url(${image})`}} className="lfa__focusareas__focusarea" key={`focusArea-${index}`}>
                <div className="lfa__focusareas__focusarea__header">
                  <h2 className="lfa__focusareas__focusarea__header__title">{focusArea?.title}</h2>
                  <div className="lfa__focusareas__focusarea__headers__desc">{focusArea?.description}</div>
                </div>

                <div className="lfa__focusareas__focusarea__footer">
                  <div className="lfa__focusareas__focusarea__footer__tms">a</div>

                  <div className="lfa__focusareas__focusarea__footer__prts">b</div>
                </div>
                <img className="lfa__focusareas__focusarea__icon" alt={focusArea?.title} src={image} />

              </div>
            );
          })}
        </div>
      </div>

      <style jsx>
        {`
          .lfa {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .lfa__titlesec {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .lfa__descsec__desc {
            color: #64748b;
            font-size: 14px;
            line-height: 24px;
            font-weight: 400;
          }

          .lfa__titles__ttl {
            font-size: 32px;
            line-height: 28px;
          }

          .lfa__focusareas {
            display: flex;
            gap: 14px;
          }

          .lfa__focusareas__focusarea {
            flex: 1;
            background-color: white;
            border-radius: 8px;
            padding: 24px 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 30px;
            position: relative;
            z-index: 1;
          }

          .lfa__focusareas__focusarea__icon {
          position: absolute;
          right: 0;
          top: 0;
          z-index: -2;
          }

          .lfa__focusareas__focusarea__header {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .lfa__focusareas__focusarea__header__title {
            font-size: 14px;
            line-height: 20px;
            font-weight: 600;
          }

          .lfa__focusareas__focusarea__footer {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .lfa__focusareas__focusarea__headers__desc {
            font-size: 14px;
            font-weight: 400;
            line-height: 22px;
          }

          .lfa__focusareas__focusarea__footer__tms {
            padding: 8px;
            background-color: #f1f5f9;
            border-radius: 4px;
          }

          .lfa__focusareas__focusarea__footer__prts {
            padding: 8px;
            background-color: #f1f5f9;
            border-radius: 4px;
          }
        `}
      </style>
    </>
  );
};

export default LandingFocusAreas;
