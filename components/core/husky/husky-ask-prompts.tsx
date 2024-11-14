// This component allows users to select prompts based on a selected topic and search for specific prompts.

import SingleSelectWithImage from '@/components/form/single-select-with-image';
import { getIrlPrompts, getProjectsPrompts, getTeamPrompts } from '@/services/home.service';
import React, { useEffect, useRef, useState } from 'react';

interface HuskyAskPromptsProps {
  suggestionTopicSelected: string;
  onPromptItemClicked: (ques: string) => void;
}

/**
 * HuskyAskPrompts component for displaying and selecting prompts based on a topic.
 * @param suggestionTopicSelected - The currently selected topic for suggestions.
 * @param onPromptItemClicked - Callback function when a prompt item is clicked.
 */
function HuskyAskPrompts({ suggestionTopicSelected, onPromptItemClicked }: HuskyAskPromptsProps) {
  // State to hold prompt information
  const [promptInfos, setPromptInfos] = useState<any>({
    teams: [],
    projects: [],
    irls: [],
  });
  const [selectedPromptInfo, setSelectedPromptInfo] = useState<any | null>(null);
  const [filteredPrompts, setFilteredPrompts] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Filters prompts based on the search key.
   * @param searchKey - The key to filter prompts by name.
   */
  const onFilterSearch = (searchKey: string) => {
    const prmtsInfo: any[] = promptInfos[suggestionTopicSelected];
    if (searchKey.trim() === '') {
      setFilteredPrompts(prmtsInfo);
    } else {
      const filtered = [...prmtsInfo].filter((v: any) => v.name.toLowerCase().includes(searchKey.toLowerCase()));
      setFilteredPrompts(filtered);
    }
  };

  useEffect(() => {
    if (filteredPrompts.length > 0) {
      setSelectedPromptInfo(filteredPrompts[0]);
    } else {
      setSelectedPromptInfo(null);
    }
  }, [filteredPrompts]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    setFilteredPrompts(promptInfos[suggestionTopicSelected]);
    setSelectedPromptInfo(promptInfos[suggestionTopicSelected][0]);
  }, [suggestionTopicSelected]);

  useEffect(() => {
    Promise.all([getTeamPrompts(), getProjectsPrompts(), getIrlPrompts()]).then((results: any) => {
      setPromptInfos({
        teams: results[0],
        projects: results[1],
        irls: results[2],
      });
      setFilteredPrompts(results[0]);
    });
  }, []);

  return (
    <>
      <div className="hap" data-testid="husky-ask-prompts">
        <div className="hap__sgs">
          <div className="hap__sgs__search">
            <img alt="search icon" className="hap__sgs__search__icon" src="/icons/search-blue.svg" />
            <input 
              ref={searchInputRef} 
              onChange={(e) => onFilterSearch(e.target.value)} 
              placeholder="Search by name" 
              className="hap__cn__search__input" 
              type="search" 
              data-testid="search-input"
            />
          </div>
          <div className="hap__sgs__list" data-testid="prompt-list">
            {filteredPrompts.map((v: any) => (
              <div 
                onClick={() => setSelectedPromptInfo(v)} 
                className={`hap__sgs__list__item ${v?.name === selectedPromptInfo?.name ? 'hap__sgs__list__item--active' : ''}`} 
                key={v.name}
                data-testid={`prompt-item-${v.name}`}
              >
                {v?.logo && <img alt="prompt logo" src={v?.logo} className="hap__sgs__list__item__img" />}
                {!v?.logo && <span className="hap__sgs__list__item__img"></span>}
                <p className="hap__sgs__list__item__text">{v.name}</p>
              </div>
            ))}
            {filteredPrompts.length === 0 && <p className="hap__sgs__list__empty">No results found</p>}
          </div>
          <div className="hap__sgs__dp">
            {filteredPrompts.length > 0 && (
              <SingleSelectWithImage
                id="husky-ask-sgs-select"
                defaultIcon="/icons/member-black.svg"
                options={filteredPrompts}
                selectedOption={selectedPromptInfo}
                onItemSelect={setSelectedPromptInfo}
                uniqueKey="name"
                displayKey="name"
                iconKey="logo"
                arrowImgUrl="/icons/arrow-blue-down.svg"
                data-testid="single-select"
              />
            )}
            {filteredPrompts.length === 0 && <p className="hap__sgs__list__empty">No results found</p>}
          </div>
        </div>
        <div className="hap__prompts">
          <h4 className="hap__prompts__title">
            <img alt="suggested prompts" width={16} height={16} src="/icons/suggestions-orange.svg" />
            <span>Suggested Prompts</span>
          </h4>
          {selectedPromptInfo?.relatedQuestions.length > 0 ? (
            <div className="hap__prompts__list" data-testid="related-questions-list">
              {selectedPromptInfo.relatedQuestions.map((question: string) => (
                <div 
                  onClick={() => onPromptItemClicked(question)} 
                  className="hap__prompts__list__item" 
                  key={question}
                  data-testid={`related-question-${question}`}
                >
                  <p className="hap__prompts__list__item__text">{question}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="hap__prompts__list__empty">No prompts found</p>
          )}
        </div>
      </div>
      <style jsx>{`
        .hap {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
        }
        .hap__prompts {
          width: 100%;
        }
        .hap__prompts__title {
          font-size: 12px;
          font-weight: 500;
          color: #ff820e;
          text-transform: uppercase;
          display: flex;
          flex-direction: row;
          gap: 8px;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid #cbd5e1;
        }

        .hap__prompts__list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 8px;
        }
        .hap__prompts__list__item {
          display: flex;
          flex-direction: row;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          align-items: center;
          background: #f1f5f9;
        }
        .hap__prompts__list__item__text {
          font-size: 13px;
        }
        .hap__prompts__list__empty {
          font-size: 13px;
          color: #94a3b8;
          text-align: center;
          padding: 12px;
        }
        .hap__sgs {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }
        .hap__sgs__search {
          display: none;
          flex-direction: row;
          gap: 8px;
          width: 256px;
          position: relative;
        }
        .hap__cn__search__input {
          width: 256px;
          padding: 8px 12px 8px 32px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          font-size: 14px;
          outline: none;
        }
        .hap__sgs__search__icon {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
        }
        .hap__sgs__dp {
          display: block;
        }
        .hap__sgs__list {
          display: none;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .hap__sgs__list__empty {
          font-size: 13px;
          color: #94a3b8;
          padding: 12px 0;
        }
        .hap__sgs__list__item {
          display: flex;
          flex-direction: row;
          gap: 8px;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          align-items: center;
          width: 100%;
        }
        .hap__sgs__list__item--active {
          background-color: #f1f5f9;
        }
        .hap__sgs__list__item__img {
          width: 20px;
          height: 20px;
          border-radius: 4px;
        }
        .hap__sgs__list__item__text {
          font-size: 14px;
        }

        @media (min-width: 1024px) {
          .hap {
            flex-direction: row;
          }
          .hap__sgs {
          }
          .hap__prompts {
            width: 436px;
          }
          .hap__sgs__list {
            display: flex;
          }
          .hap__sgs__dp {
            display: none;
          }
          .hap__sgs__search {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}

export default HuskyAskPrompts;
