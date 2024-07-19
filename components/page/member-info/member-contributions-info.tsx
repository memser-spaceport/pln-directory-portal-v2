'use client';
import { useEffect, useState } from 'react';
import AddContribution from './contributions/add-contribution';
import ContributionHead from './contributions/contribution-head';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import TextField from '@/components/form/text-field';
import MonthYearField from '@/components/form/month-year-field';
import TextArea from '@/components/form/text-area';
import HiddenField from '@/components/form/hidden-field';
import TextAreaEditor from '@/components/form/text-area-editor';
import MonthYearPicker from '@/components/form/month-year-picker';
import { getAnalyticsUserInfo, getUniqueId } from '@/utils/common.utils';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';
import { getUserInfo } from '@/utils/third-party.helper';

interface MemberContributionInfoProps {
  initialValues: any;
  projectsOptions: any[];
  errors: any;
}

function MemberContributionInfo({ initialValues, projectsOptions = [], errors = {} }: MemberContributionInfoProps) {
  const [contributionInfos, setContributionInfos] = useState(initialValues ?? []);
  const currentProjectsCount = contributionInfos?.filter((v: any) => v.currentProject === true).length;
  const [expandedId, setExpandedId] = useState(-1);
  const analytics = useSettingsAnalytics();
  const userInfo = getUserInfo();
 
  const defaultValues = {
    projectUid: getUniqueId(),
    projectName: '',
    projectLogo: '',
    currentProject: false,
    description: '',
    role: '',
    startDate: new Date('1970-01-01').toISOString(),
    endDate: new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth() + 1, 0)).toISOString(),
  };

  const onToggleExpansion = (index: number) => {
    setExpandedId((v) => {
      if (v === index) {
        return -1;
      } else {
        return index;
      }
    });
  };

  const onAddContribution = () => {
    analytics.recordMemberProjectContributionAdd('', getAnalyticsUserInfo(userInfo));
    const newExp = [...contributionInfos];
    newExp.push(defaultValues);
    setExpandedId(newExp.length - 1);
    setContributionInfos([...newExp]);
  };

  const onDeleteContribution = (index: number) => {
    if (index === expandedId) {
      setExpandedId(-1);
    }

    setContributionInfos((old: any[]) => {
      const newItem = [...old];
      newItem.splice(index, 1);
      return newItem;
    });
    analytics.recordMemberProjectContributionDelete('', getAnalyticsUserInfo(userInfo));
  };

  const getAvailableContributionOptions = () => {
    const selectedTeamUids = [...contributionInfos].filter((v) => v.projectUid !== '').map((v) => v.projectUid);
    const remainingItems = [...projectsOptions].filter((v) => !selectedTeamUids.includes(v.projectUid));
    return [...remainingItems];
  };

  const onClearProjectSearch = (index: number) => {
    setContributionInfos((old: any) => {
      old[index] = { ...old[index], projectUid: '', projectName: '', projectLogo: '', currentProject: false };
      return [...old];
    });
  };

  const onProjectSelectionChanged = (index: number, item: any) => {
    setContributionInfos((old: any) => {
      const newV = structuredClone(old);
      newV[index].projectUid = item.projectUid;
      newV[index].projectName = item.projectName;
      newV[index].projectLogo = item.projectLogo;
      return [...newV];
    });
  };

  const onProjectDetailsChanged = (index: number, value: string | boolean, key: string) => {
    if (contributionInfos[index]) {
      setContributionInfos((old: any) => {
        const newV = structuredClone(old);
        newV[index][key] = value;
        if(key === 'currentProject' && value === false) {
          newV[index]['endDate'] =  new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth() + 1, 0)).toISOString();
        } else if (key === 'currentProject' && value === true) {
          newV[index]['endDate'] = null;
        }
        return [...newV];
      });
    }
  };

  useEffect(() => {
    setContributionInfos(structuredClone(initialValues) ?? []);
    function resetHandler() {
      setContributionInfos(structuredClone(initialValues) ?? []);
    }
    document.addEventListener('reset-member-register-form', resetHandler);
    return function () {
      document.removeEventListener('reset-member-register-form', resetHandler);
    };
  }, [initialValues]);

  return (
    <>
      <div className="pc">
        {contributionInfos.length === 0 && (
          <div onClick={onAddContribution} className="pc__new">
            <img alt="add contribution" src="/icons/add-contribution.svg" width="36" height="36" />
            <p className="pc__new__text">Click to add project contributions</p>
          </div>
        )}
        {contributionInfos.length > 0 && (
          <div className="user__info">
            <img width="16" height="16" className="user__info__icon" src="/icons/info-blue.svg" />
            <p className="user__info__text">Note that you can only set upto 5 projects as current</p>
          </div>
        )}
        {contributionInfos.length > 0 && (
          <div className="pc__list">
            {Object.keys(errors).length > 0 && <p className="error">There are fields that require your attention. Please review the fields below.</p>}
            <AddContribution disableAdd={contributionInfos.length >= 20} onAddContribution={onAddContribution} />
            {contributionInfos.map((contributionInfo: any, index: number) => (
              <div className="pc__list__item" key={`member-skills-team-info-${contributionInfo.projectUid}-${index}`}>
                <ContributionHead
                  expandedId={expandedId}
                  contribution={contributionInfo}
                  contributionIndex={index}
                  currentProjectsCount={currentProjectsCount}
                  onDeleteContribution={onDeleteContribution}
                  onToggleExpansion={onToggleExpansion}
                  isError={errors[index] ? true : false}
                  onProjectStatusChanged={(value: boolean) => onProjectDetailsChanged(index, value, 'currentProject')}
                />

                <div className={`pc__list__item__form ${expandedId !== index ? 'hidden' : ''}`}>
                  {errors[index] && (
                    <ul className="error">
                      {errors[index]?.map((error: string, index: number) => (
                        <li key={`contibution-error-${index}`}>{error}</li>
                      ))}
                    </ul>
                  )}
                  <div className="pc__list__item__form__item">
                    <SearchableSingleSelect
                      placeholder="Search projects by name"
                      label="Project Name*"
                      uniqueKey="projectUid"
                      formKey="projectUid"
                      iconKey="projectLogo"
                      isMandatory={true}
                      isFormElement={true}
                      name={`contributionInfo${index}-projectUid`}
                      onClear={() => onClearProjectSearch(index)}
                      options={getAvailableContributionOptions()}
                      selectedOption={contributionInfo}
                      displayKey="projectName"
                      id={`member-contribution-project-${index}`}
                      onChange={(item) => onProjectSelectionChanged(index, item)}
                      defaultImage='/icons/project-default.svg'
                    />
                  </div>
                  <div className="pc__list__item__form__item">
                    <TextField
                      defaultValue={contributionInfo.role}
                      onChange={(e) => onProjectDetailsChanged(index, e.target.value, 'role')}
                      placeholder="eg: senior architect"
                      type="text"
                      isMandatory={true}
                      label="Role*"
                      id={`member-contribution-role-${index}`}
                      name={`contributionInfo${index}-role`}
                    /> 
                  </div>
                  <div className="pc__list__item__form__item">
                    <MonthYearPicker onDateChange={(value: string) => onProjectDetailsChanged(index, value, 'startDate')} id={`member-contribution-startDate-${contributionInfo.projectUid}-${index}`} dayValue='start' name={`contributionInfo${index}-startDate`} label="start" minYear={1970} maxYear={new Date().getFullYear()}  initialDate={contributionInfo.startDate ?? defaultValues.startDate} />
                    <MonthYearPicker onDateChange={(value: string) => onProjectDetailsChanged(index, value, 'endDate')}  id={`member-contribution-endDate-${contributionInfo.projectUid}-${index}`} dayValue='end'  name={`contributionInfo${index}-endDate`} label="end" minYear={1970} maxYear={new Date().getFullYear()} initialDate={(!contributionInfo.endDate && !contributionInfo.currentProject) ? defaultValues.endDate : contributionInfo.endDate}   />
                  </div>
                  <div className="pc__list__item__form__item">
                    <div className="editor">
                      <TextAreaEditor value={contributionInfo.description} name={`contributionInfo${index}-description`} label="Description" placeholder="Enter project contribution.." />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {expandedId !== -1 && <AddContribution disableAdd={contributionInfos.length >= 20} onAddContribution={onAddContribution} />}
          </div>
        )}
      </div>

      <style jsx>
        {`
          .editor {
            width: 100%;
          }

          .user__info {
            display: flex;
            background: #f1f5f9;
            padding: 8px 16px;
            gap: 10px;
            font-size: 14px;
            width: 100%;
            margin-bottom: 16px;
          }
          .pc {
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
          }

          .pc__new {
            border: 1px dotted #156ff7;
            display: flex;
            padding: 20px;
            gap: 10px;
            background: #f1f5f9;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            width: 100%;
            margin: 20px;
          }

          .pc__new__text {
            color: #156ff7;
            font-size: 13px;
            font-weight: 500;
          }

          .pc__list {
            width: 100%;
            padding-bottom: 70px;
          }

          .pc__list__item {
            display: flex;
            flex-direction: column;
            width: 100%;
          }
          .pc__list__item__form {
            margin: 16px 0;
            display: flex;
            flex-direction: column;
            gap: 20px;
            height: auto;
          }
          .hidden {
            visibility: hidden;
            height: 0;
            margin: 0;
            max-height: 0;
            overflow: hidden;
          }
          .pc__list__item__form__item {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .error {
            color: #ef4444;
            font-size: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 16px;
          }
          @media (min-width: 1024px) {
            .pc__list {
            }
            .user__info {
              margin: 32px 0 16px 0;
            }
            .pc__list__item__form__item {
              flex-direction: row;
              gap: 8px;
            }
          }
        `}
      </style>
    </>
  );
}

export default MemberContributionInfo;
