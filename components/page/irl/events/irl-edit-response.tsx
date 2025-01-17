interface IIrlEditRespose  {
  onEditResponseClick: any;
  isEdit: boolean;
  onEditDetailsClicked: any;
  onRemoveFromGatherings: any;
}

const IrlEditResponse = (props: IIrlEditRespose) => {
  return (
    <>
      <div className="toolbar__actionCn__edit__wrpr">
        <button onClick={props.onEditResponseClick} className="toolbar__actionCn__edit">
          Edit Response
          <img src="/icons/down-arrow-white.svg" alt="arrow" width={18} height={18} />
        </button>
        {props.isEdit && (
          <div className="toolbar__actionCn__edit__list">
            <button className="toolbar__actionCn__edit__list__item" onClick={props.onEditDetailsClicked}>
              Edit Details
            </button>
            <button onClick={props.onRemoveFromGatherings} className="toolbar__actionCn__edit__list__item">
              Remove from Gathering(s)
            </button>
          </div>
        )}
      </div>
      <style jsx>{`
        .toolbar__actionCn__edit__wrpr {
            position: relative;
          }

          .toolbar__actionCn__edit {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            cursor: pointer;
            background: #156ff7;
            color: #fff;
          }

          .toolbar__actionCn__edit__list {
            position: absolute;
            z-index: 4;
            width: 207px;
            background: #fff;
            padding: 8px;
            border-radius: 12px;
            box-shadow: 0px 2px 6px 0px #0f172a29;
            margin-top: 4px;
            left: 0;
          }

          .toolbar__actionCn__edit__list__item {
            font-size: 14px;
            font-weight: 500;
            line-height: 28px;
            text-align: left;
            color: #0f172a;
            cursor: pointer;
            padding: 4px 8px;
            white-space: nowrap;
            background: inherit;
            width: 100%;
          }

          .toolbar__actionCn__edit__list__item:hover {
            background-color: #f1f5f9;
            border-radius: 4px;
            transition: all 0.2s ease;
          }

          .toolbar__actionCn__edit:hover {
            background: #1d4ed8;
          }

          @media (min-width: 1024px) {
          .toolbar__actionCn__edit__list {
            right: 0px;
            left: unset;
          }
      }
      `}</style>
    </>
  )
}

export default IrlEditResponse;