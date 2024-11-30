import React, { useState } from 'react';
import SuggestionItem from './suggestion-item';
import Image from 'next/image';

interface ISuggestion {
  name: string;
  logoURL: string;
  group: string;
  uid: string;
}

interface SuggestionDropdownProps {
  suggestions: ISuggestion[];
  addSuggestion: any;
  onSelect: (suggestion: string) => void;
  enableAddMode: () => void;
}

const SuggestionDropdown: React.FC<SuggestionDropdownProps> = ({ suggestions, addSuggestion, onSelect, enableAddMode }) => {
  return (
    <>
      <div className="cs__dropdown">
        <div className="cs__dropdown__suggestion">
          {suggestions.length > 0 &&
            suggestions.map((suggestion, index) => {
              return (
                <div key={index} className="cs__dropdown__suggestion__group">
                  <div className="suggestion-item">
                    <SuggestionItem suggestion={suggestion} onSelect={onSelect} />
                  </div>
                </div>
              );
            })}
          {suggestions.length === 0 && (
            <div className="cs__dropdown__suggestion__group__not-found">
              <div className="cs__dropdown__suggestion__group__not-found__txt">No suggestions found</div>
            </div>
          )}
          <div className="cs__add">
            <div>{addSuggestion?.title ?? 'Not able to find yours ?'}</div>
            <div className="cs__add__action">
              <button className="cs__add__action__btn" onClick={enableAddMode}>
                <div className="cs__add__action__btn__img">
                  <Image loading="lazy" src={addSuggestion?.iconURL ?? '/icons/sign-up/share.svg'} alt="add" width={20} height={20} />
                </div>
                <div>{addSuggestion?.actionString ?? 'Add yours'}</div>
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .cs__dropdown {
          position: relative;
          width: 100%;
          padding-top: 8px;
        }

        .cs__add {
          display: flex;
          border-top: 1px solid #cbd5e1;
          justify-content: space-between;
          padding: 8px;
          color: #0f172a;
          align-items: flex-end;
          padding-bottom: 0px;
        }

        .cs__add__action {
          display: flex;
          gap: 4px;
        }

        .cs__dropdown__suggestion {
          position: absolute;
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px;
          background-color: white;
          z-index: 1;
        }

        .cs__dropdown__suggestion__group__title {
          font-size: 13px;
          font-weight: 600;
          line-height: 20px;
          padding: 0px 4px;
          border-radius: 4px;
        }

        ::placeholder {
          color: #aab0b8;
        }

        .cs__add__action__btn {
          background: white;
          color: #156ff7;
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
        }

        .cs__add__action__btn__img {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cs__dropdown__suggestion__group__not-found{
            display: flex;
            padding: 8px;
        }
      `}</style>
    </>
  );
};

export default SuggestionDropdown;
