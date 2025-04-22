import { useState } from 'react';

const SelectTags = (props: any) => {
  const { message, onTagsSelect } = props;
  const text = message?.toolInvocation?.result?.text;
  const tags = message?.toolInvocation?.result?.tags;


  const [selectedTags, setSelectedTags] = useState<any[]>([]);

  const handleTagClick = (tag: any) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((selectedTag) => selectedTag !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const onDoneClickHandler = () => {
    onTagsSelect(selectedTags);
  };

  return (
    <>
      <div className="select-tags-container">
        <div className="select-tags-container__text-container">
          <img src="/images/husky/intro-assistant.svg" alt="assistant" className="select-tags-container__text-container__profile-image" />
          <div className="select-tags-container__text-container__text">{text}</div>
        </div>

        <div className="select-tags-container__tags-container">
          {tags?.map((tag: any) => (
            <button
              className={`select-tags-container__tags-container__tag ${selectedTags.includes(tag) ? 'select-tags-container__tags-container__tag--selected' : ''}`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="select-tags-container__submit-container">
          <button onClick={onDoneClickHandler}
            className={`select-tags-container__submit-container__submit-button ${selectedTags.length === 0 ? 'select-tags-container__submit-container__submit-button--disabled' : ''}`}
            disabled={selectedTags.length === 0}
            style={{ cursor: selectedTags.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            Done
          </button>
        </div>
      </div>

      <style jsx>
        {`
          .select-tags-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .select-tags-container__text-container {
            display: flex;
            gap: 20px;
            align-items: start;
            padding: 17px 14px;
            background-color: white;
            border-radius: 8px;
          }

          .select-tags-container__text-container__text {
            font-weight: 400;
            font-size: 14px;
            line-height: 22px;
          }

          .select-tags-container__text-container__profile-image {
            width: 32px;
            height: 32px;
            border-radius: 50%;
          }

          .select-tags-container__tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .select-tags-container__tags-container__tag {
            border: 1px solid #156ff7;
            border-radius: 100px;
            line-height: 28px;
            font-size: 14px;
            font-weight: 500;
            color: #156ff7;
            padding: 0 12px;
            background-color: white;
            cursor: pointer;
          }

          .select-tags-container__tags-container__tag--selected {
            background-color: #156ff7;
            color: white;
          }

          .select-tags-container__submit-container__submit-button {
            background-color: #f1f5f9;
            color: #156ff7;
            border-radius: 100px;
            padding: 8px 0px;
            line-height: 28px;
            font-weight: 500;
            font-size: 14px;
            width: 100%;
            line-height: 28px;
            border-radius: 12px;
            border: 1px solid #156ff7;
          }

        `}
      </style>
    </>
  );
};

export default SelectTags;
