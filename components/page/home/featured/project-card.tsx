'use client';

const ProjectCard = () => {
  const contributors = [
    {
      id: 'uid-yosuva',
      logo: 'https://loremflickr.com/640/480/animals',
    },
    {
      id: 'uid-ss',
      logo: 'https://loremflickr.com/640/480/animals',
    },
  ] as any;
  return (
    <>
      <div className="projectCard">
        <div className="projectCard__header">
          <img className="projectCard__header__img" src="https://loremflickr.com/640/480/animals" width={72} height={72} alt="team image" />
          <div className="projectCard__header__badge">New</div>
          <div className="white-line" />
          <div className="projectCard__header__notch">
            <img src="/icons/clip.svg" />
          </div>
          <div className="projectCard__header__avatars">
            {contributors.map((contributor: any, index: number) => (
              <img key={contributor?.id} width={24} height={24} src={contributor.logo} alt="contributor" className="projectCard__header__avatar" />
            ))}
            <div className="projectCard__header__avatars__more">+2</div>
          </div>
        </div>
        <div className="projectCard__content">
          <h3 className="projectCard__content__ttl">Team with ask</h3>
          <p className="projectCard__content__desc">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labor.</p>
        </div>
        <div className="projectCard__footer"></div>
      </div>
      <style jsx>{`
        .projectCard__header__notch {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 21px;
        }

        .white-line {
          position: absolute;
          left: 0;
          bottom: -1px;
          width: 87px;
          height: 1px;
          background: #fff;
        }

        .projectCard {
          width: 289px;
          height: 290px;
          border-radius: 12px;
          box-shadow: 0px 4px 4px 0px #0f172a0a, 0px 0px 1px 0px #0f172a1f;
          background-color: white;
          display: flex;
          flex-direction: column;
        }

        .projectCard__header {
          background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 205.47%);
          min-height: 64px;
          border-bottom: 1px solid #e2e8f0;
          position: relative;
          border-radius: 12px 12px 0px 0px;
          display: flex;
          justify-content: end;
        }

        .projectCard__header__img {
          border-radius: 4px;
          position: absolute;
          transform: translateX(50%);
          right: 50%;
          top: 20px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
        }

        .projectCard__content {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .projectCard__content__ttl {
          font-size: 18px;
          font-weight: 600;
          line-height: 28px;
          text-align: center;
          color: #0f172a;
          margin-top: 38px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding: 0px 17px;
        }

        .projectCard__content__desc {
          font-size: 14px;
          font-weight: 400;
          line-height: 22px;
          text-align: center;
          color: #475569;
          padding: 0px 17px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .projectCard__header__avatars {
          display: flex;
          align-items: center;
          position: absolute;
          left: 15px;
          bottom: -14px;
        }

        .projectCard__header__avatar {
          border-radius: 50%;
          background-color: #e2e8f0;
          object-fit: cover;
          border: 1px solid #cbd5e1;
          margin-right: -10px;
        }

        .projectCard__header__avatars__more {
          background-color: #e2e8f0;
          color: #475569;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #cbd5e1;
          font-size: 12px;
          font-weight: 500;
          line-height: 28px;
        }

        .projectCard__header__badge {
          color: #fff;
          border-radius: 15px;
          font-size: 12px;
          font-weight: 500;
          line-height: 28px;
          background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
          width: 42px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0px 12px 0px 12px;
        }

        .projectCard__footer {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(215, 255, 221, 0.5) 100%);
          min-height: 70px;
          border-radius: 0px 0px 12px 12px;
        }
      `}</style>
    </>
  );
};

export default ProjectCard;
