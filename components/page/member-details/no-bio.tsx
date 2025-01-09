interface INoBio {
  onAddBioClick: () => void;
}

export default function NoBio({ onAddBioClick }: INoBio) {
  return (
    <>
      <div className="bioCn__add">
        <div>Your bio is empty. Tell others about yourself—your background, interests, or expertise!</div>
        <div>
          <button className="bioCn__add__bio-btn" onClick={onAddBioClick}>
            Add Bio
          </button>
        </div>
      </div>
      <style jsx>
        {`
          .bioCn__add {
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }

          .bioCn__add__bio-btn {
            height: 40px;
            padding: 10px 24px 10px 24px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            background: white;
          }

          @media (min-width: 426px) {
            .bioCn__add {
              flex-direction: row;
              align-items: center;
            }
          }
        `}
      </style>
    </>
  );
}
