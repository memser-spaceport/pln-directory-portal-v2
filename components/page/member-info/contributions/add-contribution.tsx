function AddContribution(props) {
  const onAddContribution = props.onAddContribution;
  return (
    <>
      <div className="ch">
        <button onClick={onAddContribution} className="ch__btn">
          <img width="14" height="14" alt="Add Contribution button" src="/icons/expand-blue.svg" />
          <span>Add Contribution</span>
        </button>
        <p className="ch__info">(Max 20 contributions)</p>
      </div>
      <style jsx>
        {`
          .ch {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
            margin-bottom: 12px;
          }
          .ch__btn {
            color: #156ff7;
            font-size: 14px;
            display: flex;
            gap: 4px;
            cursor: pointer;
            align-items: center;
            justify-content: center;
            background: none;
            outline: none;
            border: none;
          }
          .ch__info {
            color: #94a3b8;
            font-size: 14px;
          }
        `}
      </style>
    </>
  );
}

export default AddContribution;
