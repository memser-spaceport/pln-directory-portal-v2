const GridViewLoader = (props: any, index: number) => {
  return (
    <>
        <div className="member-grid">
          <div className="member-grid__profile-container">
            <div className="member-grid__profile-container__outer-section">
              <div className="member-grid__profile-container__outer-section__inner-circle">
                <div className="member-grid__profile-container__outer-section__inner-circle__profile" />
              </div>
            </div>
          </div>
          <div className="member-grid__details">
            <div>
              <div className="member-grid__details__member-details">
                <div className="member-grid__details__member-details__name-container">
                  <div className="member-grid__details__name" />
                </div>
                <div className="member-grid__details__member-details__team-name-container">
                  <div className="member-grid__details__member-details__team-name-container__team-name" />
                </div>
                <div className="member-grid__details__member-details__role" />
              </div>
              <div className="member-grid__details__location">
                <div className="member-grid__details__location__name" />
              </div>
            </div>
            <div className="member-grid__profile-container__ftr">
              <div className="member-grid__profile-container__ftr__skills__mob">
                <div className="member-grid__profile-container__ftr__skills__mob__skill" />
              </div>
              <div className="member-grid__profile-container__ftr__skills__desc">
                <div className="member-grid__profile-container__ftr__skills__desc__skill" />
                <div className="member-grid__profile-container__ftr__skills__desc__skill" />
                <div className="member-grid__profile-container__ftr__skills__desc__skill" />
              </div>
            </div>
          </div>
        </div>
      <style jsx>{`
        .grid-view-loader {
          display: grid;
          grid-template-columns: repeat(auto-fit, 167.5px);
          justify-content: center;
          row-gap: 24px;
          column-gap: 16px;
          width: 100%;
          padding: 2px;
        }

        .member-grid {
          height: 166px;
          width: 167.5px;
          border-radius: 12px;
          box-shadow: 0px 4px 4px 0px #0f172a0a;
          background: #fff;
        }

        .member-grid__profile-container {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px 12px 0 0;
          height: 33px;
          background: linear-gradient(180deg, #fff 0%, #e2e8f0 205.47%);
          position: relative;
        }

        .member-grid__profile-container__outer-section {
          position: absolute;
          z-index: 1;
          top: 13px;
        }

        .member-grid__profile-container__outer-section__inner-circle {
          height: 36px;
          width: 36px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f0f0f0;
        }

        .member-grid__profile-container__outer-section__inner-circle__profile {
          height: 100%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1s ease-in-out infinite;
        }

        .member-grid__details {
          padding: 18px 12px 12px 12px;
          background: #fff;
          height: 133px;
          display: flex;
          justify-content: space-between;
          flex-direction: column;
          border-radius: 0 0 12px 12px;
          border-top: 1px solid #e2e8f0;
          position: relative;
        }

        .member-grid__details__member-details {
          display: flex;
          align-items: center;
          flex-direction: column;
          gap: 4px;
        }

        .member-grid__details__member-details__name-container {
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .member-grid__details__name {
          width: 100px;
          height: 12px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1s ease-in-out infinite;
          border-radius: 4px;
        }

        .member-grid__details__member-details__team-name-container {
          display: flex;
          gap: 4px;
          align-items: center;
          justify-content: center;
        }

        .member-grid__details__member-details__team-name-container__team-name {
          width: 80px;
          height: 12px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1s ease-in-out infinite;
          border-radius: 4px;
        }

        .member-grid__details__member-details__role {
          width: 60px;
          height: 12px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1s ease-in-out infinite;
          border-radius: 4px;
        }

        .member-grid__details__location {
          display: none;
        }

        .member-grid__profile-container__ftr {
          padding: 0px;
        }

        .member-grid__profile-container__ftr__skills__mob {
          display: block;
        }

        .member-grid__profile-container__ftr__skills__desc {
          display: none;
        }

        .member-grid__profile-container__ftr__skills__mob__skill,
        .member-grid__profile-container__ftr__skills__desc__skill {
          width: 40px;
          height: 20px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1s ease-in-out infinite;
          border-radius: 4px;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @media (min-width: 1024px) {
          .grid-view-loader {
            grid-template-columns: repeat(auto-fit, 289px);
            padding: unset;
          }

          .member-grid {
            height: 289px;
            width: 289px;
          }

          .member-grid__profile-container {
            height: 94px;
          }

          .member-grid__profile-container__outer-section {
            background: url('/images/outer-circle.svg');
            height: 147px;
            width: 147px;
            margin: auto;
            display: flex;
            justify-content: center;
            position: relative;
            background-repeat: no-repeat;
            z-index: unset;
            top: unset;
          }

          .member-grid__profile-container__outer-section__inner-circle {
            height: 104px;
            width: 104px;
          }

          .member-grid__details {
            height: 195px;
            padding: 16px;
          }

          .member-grid__details__name {
            width: 150px;
            height: 18px;
          }

          .member-grid__details__member-details__team-name-container__team-name {
            width: 120px;
            height: 14px;
          }

          .member-grid__details__member-details__role {
            width: 100px;
            height: 14px;
          }

          .member-grid__profile-container__ftr {
            padding: 16px 0 0 0;
            border-top: 1px solid #e2e8f0;
          }

          .member-grid__profile-container__ftr__skills__desc {
            display: flex;
            gap: 8px;
          }

          .member-grid__profile-container__ftr__skills__mob {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default GridViewLoader;
