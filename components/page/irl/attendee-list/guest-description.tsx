import { useState } from 'react';

interface IDescription {
  description: string;
}

const GuestDescription = (props: IDescription) => {
  const description = props?.description ?? '';
  const [isReadMore, setIsReadMore] = useState(true);

  const toggleReadMore = () => {
    setIsReadMore(!isReadMore);
  };

  if (description?.length <= 50) {
    return (
      <>
        <div className="description-text">{description}</div>
        <style jsx>{`
          .description-text {
            font-size: 13px;
            line-height: 22px;
            font-weight: normal;
            color: #0f172a;
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <div className="description-container">
        {isReadMore ? `${description?.slice(0, 50)}...` : description}
        <span onClick={toggleReadMore} className="toggle-text">
          {isReadMore ? ' read more' : ' read less'}
        </span>
      </div>
      <style jsx>{`
        .description-container {
          word-break: break-word;
          font-size: 13px;
          line-height: 22px;
          font-weight: normal;
          color: #0f172a;
        }

        .toggle-text {
          cursor: pointer;
          font-size: 13px;
          line-height: 22px;
          font-weight: 500;
          color: #156ff7;
        }
      `}</style>
    </>
  );
};

export default GuestDescription;
