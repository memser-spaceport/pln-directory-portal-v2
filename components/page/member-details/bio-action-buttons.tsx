const BioAction = ({ onCancelClickHandler, onSaveClickHandler, bioEditMode }: any) => {
  return (
    <>
      <div className="bioCn__header__action">
        <button className="bioCn__header__action__cancel" onClick={onCancelClickHandler}>
          <span className="bioCn__header__action__cancel__txt">Cancel</span>
        </button>
        <button className="bioCn__header__action__save" onClick={onSaveClickHandler}>
          <span className="bioCn__header__action__save__txt">{bioEditMode === 'ADD' ? 'Add Bio' : 'Save'}</span>
        </button>
      </div>
      <style jsx>{`
        .bioCn__header__action__cancel {
          padding: 8px 16px;
          background: white;
          border: 1px solid #156ff7;
          border-radius: 8px;
        }

        .bioCn__header__action__cancel__txt {
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          text-align: left;
          color: #156ff7;
        }

        .bioCn__header__action__save {
          padding: 8px 16px;
          background: white;
          border: 1px solid #156ff7;
          border-radius: 8px;
          background: #156ff7;
        }

        .bioCn__header__action__save__txt {
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          text-align: left;
          color: white;
        }
        .bioCn__header__action {
          display: flex;
          gap: 8px;
        }
      `}</style>
    </>
  );
};

export default BioAction;