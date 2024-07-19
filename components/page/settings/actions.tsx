'use client'
function SettingsAction() {
  return (
    <>
       <div className="fa">
          <div className="fa__action">
            <button className="fa__action__cancel" type="reset">
              Reset
            </button>
            <button className="fa__action__save" type="submit">
              Save Changes
            </button>
          </div>
        </div>
      <style jsx>
        {`
         .fa {
            position: sticky;
            border-top: 1px solid #ff820e;
            margin: 0;
            width: 100%;
            flex-direction: column;
            bottom: 0px;
            padding: 8px 16px;
            left: auto;
            background: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            //visibility: hidden;
            z-index: 2;
          }
          .fa__info {
            display: flex;
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            align-items: center;
            gap: 6px;
          }

          .fa__action {
            display: flex;
            gap: 16px;
          }
          .fa__action__save {
            padding: 10px 24px;
            background: #156ff7;
            color: white;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
          }
          .fa__action__cancel {
            padding: 10px 24px;
            background: white;
            color: #0f172a;
            font-size: 14px;
            border: 1px solid #cbd5e1;
            font-weight: 500;
            border-radius: 8px;
          }
          @media (min-width: 1024px) {
            .fa {
              height: 64px;
              flex-direction: row;
              left: auto;
              justify-content: flex-end;
              align-items: center;
              padding: 16px;
            }
          }
        `}
      </style>
    </>
  );
}

export default SettingsAction;
