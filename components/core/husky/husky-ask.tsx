'use client';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import BarTabs from '@/components/ui/bar-tabs';
import { getIrlPrompts, getProjectsPrompts, getTeamPrompts } from '@/services/home.service';
import {  useEffect, useRef, useState } from 'react';

function HuskyAsk(props: any) {
  const onPromptClicked = props.onPromptClicked;
  const [suggestionTopicSelected, setSuggestionTopic] = useState('teams');
  const [promptInfos, setPromptInfos] = useState<any>({
    teams: [],
    projects: [],
    irls: [],
  });
  const [selectedPromptInfo, setSelectedPromptInfo] = useState<any | null>(null);
  const [filteredPrompts, setFilteredPrompts] = useState<any[]>([]);
  const suggestionTopics = [
    { name: 'TEAMS', key: 'teams', activeIcon: '/icons/users-blue.svg', inActiveIcon: '/icons/users-grey.svg' },
    { name: 'PROJECTS', key: 'projects', activeIcon: '/icons/projects-blue.svg', inActiveIcon: '/icons/projects-grey.svg' },
    { name: 'IRL GATHERINGS', key: 'irls', activeIcon: '/icons/calendar-blue.svg', inActiveIcon: '/icons/calendar-grey.svg' },
  ];

  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const {trackPromptTypeSelection, trackUploadData, trackPromptSelection} = useHuskyAnalytics()

  const onTabSelectionChanged = (v: string) => {
    trackPromptTypeSelection(v);
    setSuggestionTopic(v);
    setFilteredPrompts(promptInfos[v]);
    if(searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  const onPromptItemClicked = (quest: string) => {
    trackPromptSelection(quest)
    onPromptClicked(quest)
      .then(() => console.log())
      .catch((e: any) => console.error());
  };

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
      <div className="huskyask">
        <p className="huskyask__info">
          Husky&apos;s fetching capacities is currently limited to the data from the following teams, projects and events today. You may not get appropriate responses if anything beyond this scope is
          requested.
        </p>
        <div className="huskyask__st">
          <div className="huskyask__st__tab">
            <BarTabs activeItem={suggestionTopicSelected} onTabSelected={(v) => onTabSelectionChanged(v)} items={suggestionTopics} />
          </div>
          <div className="huskyask__st__list">
            <div className="huskyask__st__list__content">
              <div className="huskyask__st__list__cn__search">
                <img className="huskyask__st__list__cn__search__icon" src="/icons/search-blue.svg" />
                <input ref={searchInputRef} onChange={(e) => onFilterSearch(e.target.value)} placeholder="Search by name" className="huskyask__st__list__cn__search__input" type="search" />
              </div>
              <div className="huskyask__st__list__cn__lt">
                {filteredPrompts.map((v: any) => (
                  <div
                    onClick={() => setSelectedPromptInfo(v)}
                    className={`huskyask__st__list__cn__lt__item ${v?.name === selectedPromptInfo?.name ? 'huskyask__st__list__cn__lt__item--active' : ''}`}
                    key={v.name}
                  >
                    {v?.logo && <img src={v?.logo} className="huskyask__st__list__cn__lt__item__img" />}
                    {!v?.logo && <span className='huskyask__st__list__cn__lt__item__img'></span>}
                    <p className="huskyask__st__list__cn__lt__text">{v.name}</p>
                  </div>
                ))}
                {filteredPrompts.length === 0 && <p>No results found</p>}
              </div>
            </div>
            <div className="huskyask__st__list__info">
              <img alt="Add your data" src="/icons/husky-add.svg" />
              <p className="huskyask__st__list__info__txt">Want Husky to be able to fetch results for your teams, projects and members too?</p>
              <a onClick={trackUploadData} target='_blank' href='' className="huskyask__st__list__info__btn">Upload data</a>
            </div>
          </div>
        </div>
        <div className="huskyask__sp">
          <div className="huskyask__sp__tab">
            <p className="huskyask__sp__tab__item">
              <img width={16} height={16} src="/icons/suggestions-orange.svg" />
              <span>Suggested Prompts</span>
            </p>
          </div>
          <div className="huskyask__sp__content">
            <div className="huskyask__sp__content__list">
              {selectedPromptInfo &&
                selectedPromptInfo?.relatedQuestions.map((prompt: string) => (
                  <p key={prompt} onClick={() => onPromptItemClicked(prompt)} className="huskyask__sp__content__list__item">
                    {prompt}
                  </p>
                ))}
              {!selectedPromptInfo && <p>No suggestions available</p>}
            </div>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .huskyask {
          }

          .huskyask__info {
            font-size: 14px;
            line-height: 24px;
            padding: 12px 16px;
          }

          .huskyask__st {
            width: 100%;
          }
          .huskyask__st__tab {
            height: 36px;
            width: 100%;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #cbd5e1;
            border-top: 1px solid #cbd5e1;
            padding: 0 16px;
            gap: 12px;
          }
          .huskyask__st__tab__item {
            font-size: 12px;
            font-weight: 500;
          }

          .huskyask__sp {
            width: 100%;
          }
          .huskyask__sp__content {
            padding: 16px;
          }
          .huskyask__sp__content__list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .huskyask__sp__content__list__item {
            padding: 8px 14px;
            background: #f1f5f9;
            font-size: 14px;
            border-radius: 8px;
            cursor: pointer;
          }

          .huskyask__st__list__cn__lt__item--active {
            background: #f1f5f9;
          }
          .huskyask__sp__tab {
            height: 36px;
            width: 100%;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #cbd5e1;
            border-top: 1px solid #cbd5e1;
            padding: 0 16px;
          }
          .huskyask__sp__tab__item {
            font-size: 12px;
            font-weight: 500;
            color: #ff820e;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            height: 36px;
            display: flex;
            gap: 4px;
            align-items: center;
          }
          .huskyask__st__list {
            padding: 16px;
            height: 310px;
            display: flex;
            gap: 8px;
            width: 100%;
          }
          .huskyask__st__list__content {
            height: 100%;
            gap: 16px;
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .huskyask__st__list__cn__lt__item {
            padding: 9px 8px;
            display: flex;
            font-size: 13px;
            display: flex;
            gap: 6px;
            align-items: center;
            cursor: pointer;
          }

          .huskyask__st__list__cn__lt__item__img {
            height: 24px;
            width: 24px;
            border-radius: 3px;
          }
          .huskyask__st__list__cn__lt__text {
            flex: 1;
          }

          .huskyask__st__list__cn__search {
            width: 100%;
            position: relative;
          }
          .huskyask__st__list__cn__search__icon {
            position: absolute;
            bottom: 12px;
            left: 6px;
          }
          .huskyask__st__list__cn__search__input {
            height: 40px;
            width: 100%;
            max-width: 256px;
            border: 1px solid #cbd5e1;
            outline: none;
            padding: 8px 12px;
            border-radius: 4px;
            padding-left: 26px;
          }
          .huskyask__st__list__cn__lt {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow-y: scroll;
            height: 100%;
          }

          .huskyask__st__list__info {
            width: 130px;
            background: #f1f5f9;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 16px;
            text-align: center;
            font-size: 12px;
            line-height: 18px;
            font-weight: 400;
            gap: 20px;
          }
          .huskyask__st__list__info__txt {
            font-size: 12px;
            width: 100%;
          }
          .huskyask__st__list__info__btn {
            background: #156ff7;
            color: white;
            padding: 10px;
            outline: none;
            border: none;
            border-radius: 8px;
            box-shadow: 1px 1px 1px rgba(15, 23, 42, 0.08);
          }
          @media (min-width: 1024px) {
            .huskyask__st__list__info {
              width: 388px;
            }
            .huskyask__st__list__info__txt {
              font-size: 14px;
            }
            .huskyask__st__list__cn__lt__item {
              padding: 9px 16px;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyAsk;
