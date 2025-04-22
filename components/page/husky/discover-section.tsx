const DiscoverSection = (props: any) => {
  const questoins = props?.questions ?? [];

  return (
    <>
      <div className="discover-section">
        <div className="discover-section__header">
          <p className="discover-section__header-title">Here's what you can do with Husky</p>
        </div>

        <div className="discover-section__body">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="discover-section__body-item" key={index}>
              <p className="discover-section__body-item-title">{index}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>
        {`
          .discover-section {
            display: flex;
            gap: 15px;
            flex-direction: column;
          }

          .discover-section__header-title {
            font-weight: 600;
            font-size: 20px;
            line-height: 20px;
          }

          .discover-section__body {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .discover-section__body-item {
            width: 194px;
            height: 142px;
            background-color: #fff;
            border-radius: 7px;
            border: double 1px transparent;
            background-image: linear-gradient(white, white), linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow: 0px 0px 10px 0px #00000024;

            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}
      </style>
    </>
  );
};

export default DiscoverSection;
