const PlEventCard = () => {
  return (
    <div className="pl-event-card">
      <div className="pl-event-card__top-image" aria-hidden="true">
        <img src="/images/view-event-card-top.png" alt="" width={150} height={100} className="pl-event-card__image" />
      </div>

      <div className="pl-event-card__text">View All Events</div>

      <div className="pl-event-card__bottom-image" aria-hidden="true">
        <img
          src="/images/view-event-card-bottom.png"
          alt=""
          width={150}
          height={100}
          className="pl-event-card__image"
        />
      </div>

      <style jsx>{`
        .pl-event-card__image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
        }

        .pl-event-card {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          width: 164px;
          height: 150px;
          border-radius: 8px;
          background: linear-gradient(180deg, #edf8ff 0%, #e0ffe3 100%);
          overflow: hidden;
          border: 1px solid #44d5bb;
          text-decoration: none;
        }

        .pl-event-card__top-image,
        .pl-event-card__bottom-image {
          position: absolute;
          width: calc(100% + 40px);
          height: 80px;
          overflow: hidden;
          transition: transform 0.4s ease;
        }

        .pl-event-card__top-image {
          top: -10px;
          right: -20px;
        }

        .pl-event-card__bottom-image {
          bottom: -10px;
          left: -5px;
        }

        .pl-event-card__text {
          font-size: 13px;
          font-weight: 500;
          color: #0f172a;
          z-index: 1;
          position: relative;
        }

        .pl-event-card:hover .pl-event-card__top-image {
          transform: translate(-10px, 8px);
        }

        .pl-event-card:hover .pl-event-card__bottom-image {
          transform: translate(10px, -8px);
        }

        @media (min-width: 360px) {
          .pl-event-card {
            width: 140px;
            height: 100px;
          }
        }

        @media (min-width: 1024px) {
          .pl-event-card {
            width: 164px;
            height: 150px;
            padding-bottom: 12px;
          }

          .pl-event-card__top-image,
          .pl-event-card__bottom-image {
            height: 100px;
          }

          .pl-event-card__text {
            margin-top: 15px;
          }
        }

        @media (min-width: 1440px) {
          .pl-event-card {
            width: 162px;
            height: 149px;
          }
        }

        @media (min-width: 1920px) {
          .pl-event-card {
            width: 223px;
            height: 150px;
          }

          .pl-event-card__image {
            width: 200px;
          }

          .pl-event-card__bottom-image > img {
            width: 300px;
          }
        }

        @media (min-width: 2560px) {
          .pl-event-card {
            width: 304px;
            height: 150px;
          }

          .pl-event-card__bottom-image > img {
            width: 450px;
          }
        }
      `}</style>
    </div>
  );
};

export default PlEventCard;
