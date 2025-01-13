import { Tooltip } from '../core/tooltip/tooltip';

const AskBox = (props: any) => {
  const info = props?.info;
  const callback = props?.callback;

  return (
    <>
      <div className="teamCard-footer">
        <div className="teamCard-footer__cnt">
          <img alt="wave" src="/icons/ask.svg" height={18} width={18} />
          <Tooltip side='top' asChild trigger={<div className="teamCard-footer__cnt__info">{info?.text}</div>} content={info?.description} />
          {info?.link && (
            <a href={info?.link} target="_blank" className="teamCard-footer__cnt__url">
              <img src="/icons/navigation.svg" height={16} width={16} alt="link" />
            </a>
          )}
        </div>
      </div>
      <style jsx>
        {`
          .teamCard-footer {
            background: linear-gradient(71.47deg, rgba(66, 125, 255, 0.15) 8.43%, rgba(68, 213, 187, 0.15) 87.45%);
            border-top: 0.4px solid #93c5fd;
            height: 36px;
            border-radius: 0px 0px 12px 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .teamCard-footer__cnt {
            display: flex;
            gap: 4px;
            width: fit-content;
            align-items: center;
          }

          .teamCard-footer__cnt__info {
            font-weight: 400;
            font-size: 14px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            line-height: 20px;
          }

          .teamCard-footer__cnt__url {
            height: 16px;
          }
        `}
      </style>
    </>
  );
};

export default AskBox;
