'use client';
const LinkTab = (props: any) => {
  const { resource, handleAdditionalResourceClicked } = props;
  return (
    <div className="link__tab">
      <a
        className="link__tab__text"
        href={resource?.link}
        target="_blank"
        onClick={() => handleAdditionalResourceClicked(resource)}
      >
        {resource?.type}
      </a>
      <div>
        <img src="/icons/arrow-blue.svg" alt="arrow icon" />
      </div>

      <style jsx>{`
        .link__tab {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          background: rgba(255, 255, 255, 1);
          border: 1.5px solid rgba(226, 232, 240, 1);
          border-radius: 6px;
          cursor: pointer;
          text-decoration: none;
          outline: none;
          height: 100%;
          max-width: 100%;
        }

        .link__tab__text {
          font-size: 13px;
          font-weight: 500;
          color: rgba(71, 85, 105, 1);
          line-height: 20px;
          letter-spacing: 0;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .link__tab:hover .link-arrow {
          transform: translate(1px, -1px);
        }
      `}</style>
    </div>
  );
};
export default LinkTab;
