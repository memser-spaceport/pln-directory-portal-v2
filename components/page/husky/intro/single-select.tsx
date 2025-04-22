const SingleSelect = (props: any) => {
  const { question, options, onSelect } = props;

  const handleSelect = (option: any) => {
    onSelect(option.text);
  }

  return (
    <>
      <div className="single-select-container">
        <div className="single-select-container__question">
          <img src="/images/husky/intro-assistant.svg" alt="assistant" />
          <div className="single-select-container__question-text">{question}</div>
        </div>
        <div className="single-select-container__options">
          {options?.map((option: any, index: number) => (
            <button className={`single-select-container__option ${index + 1 !== options.length ? 'border-bottom': '' }`} onClick={() => handleSelect(option)}>
              {option.text} 
            </button>
          ))}
        </div>
      </div>

      <style jsx>
        {`
          .single-select-container {
            display: flex;
            gap: 10px;
            flex-direction: column;
          }

          .single-select-container__question {
            display: flex;
            align-items: flex-start;
            background: white;
            padding: 12px 14px;
            gap: 12px;
            background-color: white;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }

          .single-select-container__question-text {
            font-weight: 400;
            font-size: 14px;
            line-height: 22px;
            color: #000;
          }

          .single-select-container__options {
            border: 1px solid #156ff7;
            border-radius: 12px;
            background-color: white;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .single-select-container__option {
            padding: 8px 12px;
            font-weight: 500;
            font-size: 14px;
            line-height: 28px;
            color: #156ff7;
            width: 100%;
            text-align: left;
          }

          .border-bottom {
            border-bottom: 1px solid #156FF7;
          }
        `}
      </style>
    </>
  );
};

export default SingleSelect;
