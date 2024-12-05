import React from 'react';
import Image from 'next/image';
import { getColorObject } from '@/utils/sign-up.utils';
import { GROUP_TYPES } from '@/utils/constants';

/**
 * SuggestionItem component renders a suggestion item with its logo, name, and group.
 *
 * @param {Object} props - The properties object.
 * @param {Object} props.suggestion - The suggestion object containing details to display.
 * @param {string} props.suggestion.logoURL - The URL of the suggestion's logo.
 * @param {string} props.suggestion.name - The name of the suggestion.
 * @param {string} props.suggestion.group - The group to which the suggestion belongs.
 * @param {Function} props.onSelect - The callback function to call when the suggestion item is clicked.
 *
 * @returns {JSX.Element} The rendered SuggestionItem component.
 */
const SuggestionItem = ({ suggestion, onSelect }: any) => {
  const clrObj = getColorObject(suggestion.group);

  return (
    <>
      <div className="suggestion-item" onClick={() => onSelect(suggestion)}>
        <div className="suggestion-item__team">
          <div className="suggestion-item__img">
            <Image
              src={suggestion.logoURL ? suggestion.logoURL : suggestion.group === GROUP_TYPES.TEAM ? '/icons/team-default-profile.svg' : '/icons/default-project.svg'}
              alt={suggestion.name}
              width={22}
              height={22}
              className="suggestion-item__img__item"
            />
          </div>
          <div className="suggestion-item__name">{suggestion.name}</div>
        </div>
        <span style={{ color: `${clrObj.color}`, background: `${clrObj.bgColor}` }} className="suggestion-item__group">
          {suggestion.group}
        </span>
      </div>
      <style jsx>{`
        .suggestion-item {
          padding: 8px;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          gap: 4px;
          align-items: center;
          justify-content: space-between;
        }

        .suggestion-item__team {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .suggestion-item:hover {
          background-color: #f1f5f9;
        }

        .suggestion-item__img__item{
          color: #475569;
        }

        .suggestion-item__img {
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          height: 24px;
          width: 24px;
          overflow: hidden;
        }

        .suggestion-item__name {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
        }

        .suggestion-item__group {
          display: flex;
          flex-direction: row;
          align-items: flex-end;
          padding: 0px 4px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          line-height: 20px;
        }
      `}</style>
    </>
  );
};

export default SuggestionItem;
