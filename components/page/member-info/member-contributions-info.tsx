'use client';
import { useState } from 'react';
import ContributionForm from './contributions/contribution-form';

function MemberContributionInfo(props: any) {
  const [contributionInfos, setContributionInfos] = useState(props.projectContributions ?? []);
  const showAddProject = props.showAddProject ?? false;
  const errors = props.contributionErrors ?? [];
  const currentProjectsCount = contributionInfos.filter((v: any) => v.currentProject === true).length;
  const onChange = props.onChange;
  const initialValues = props?.initialValues?.projectContributions ?? [];
  const intialProjectContributions = [...initialValues];

  const [expandedId, setExpandedId] = useState(-1);
  const [isLoading, setLoaderStatus] = useState(false);

  const defaultValues = {
    projectUid: '',
    projectName: '',
    projectLogo: '',
    currentProject: false,
    description: '',
    role: '',
    startDate: new Date(1990, 0),
    endDate: new Date(),
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
    const newExp = [...contributionInfos];
    newExp.push(defaultValues);
    setExpandedId(newExp.length - 1);
    setContributionInfos([...newExp]);
  };

  const onDeleteContribution = (index: number) => {
    if (index === expandedId) {
      setExpandedId(-1);
    }
    const newExp = [...contributionInfos];
    newExp.splice(index, 1);
    setContributionInfos([...newExp]);
  };

  const onItemChange = (index: number, key: string, value:any) => {
    const newExp = [...contributionInfos];
    newExp[index][key] = value;
    if (key === 'currentProject' && value === false) {
      newExp[index].endDate = intialProjectContributions[index]?.endDate || new Date();
    } else if (key === 'currentProject' && value === true) {
      newExp[index].endDate = null;
    }
    onChange({ target: { name: 'projectContributions', value: [...newExp] } });
  };

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
          <div className="pc__list">
            {contributionInfos.length > 0 && (
              <div className="pc__list__add">
                {contributionInfos.length <= 19 && (
                  <button onClick={onAddContribution} className="pc__list__add__btn">
                    <img className="" src="/icons/expand-blue.svg" />
                    <span>Add Contribution</span>
                  </button>
                )}
                <p className="pc__list__info">(Max 20 contributions)</p>
              </div>
            )}
            {contributionInfos.map((contributionInfo: any, index: number) => (
              <div className="pc__list__item" key={`member-skills-team-info-${index}`}>
                <ContributionForm
                  showAddProject={showAddProject}
                  currentProjectsCount={currentProjectsCount}
                  errors={errors}
                  setLoaderStatus={setLoaderStatus}
                  onToggleExpansion={onToggleExpansion}
                  expandedId={expandedId}
                  key={`${index}-exp`}
                  onDeleteContribution={onDeleteContribution}
                  exp={contributionInfo}
                  contributionIndex={index}
                  onItemChange={onItemChange}
                  contributions={contributionInfos}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>
        {`
          .pc {
            height: 100%;
            width: 100%;
            display: flex;
            align-items: flex-start;
            justify-content: center;
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
          }

          .pc__new__text {
            color: #156ff7;
            font-size: 13px;
            font-weight: 500;
          }

          .pc__list {
            width: 100%;
            padding-top: 32px;
          }
          .pc__list__add {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
          }
          .pc__list__add__btn {
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
          .pc__list__info {
            color: #94a3b8;
            font-size: 14px;
          }
          .pc__list__item {
            display: flex;
            flex-direction: column;
            width: 100%;
          }
        `}
      </style>
    </>
  );
}

export default MemberContributionInfo;
