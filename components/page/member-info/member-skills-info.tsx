'use client';
import HiddenField from '@/components/form/hidden-field';
import MultiSelect from '@/components/form/multi-select';
import RadioButton from '@/components/form/radio-button';
import SearchableMultiSelect from '@/components/form/searchable-multi-select';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import TextField from '@/components/form/text-field';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface TeamAndRoleOptions {
  teamTitle: string;
  role: string;
  teamUid: string;
}

interface SkillsOptions {
  name: string;
  id: string;
}

function MemberSkillsInfo(props:any) {
  const teamOptions = props.teamsOptions;
  const skillsOptions = props.skillsOptions;
  const errors = props.errors;
  const initialValues = props.initialValues
  const [teamsinfo, setTeamsInfo] = useState<TeamAndRoleOptions[]>(initialValues.teamsAndRoles);
  const [selectedSkills, setSelectedSkills] = useState<SkillsOptions[]>(initialValues.skills);

  const onAddTeam = () => {
    setTeamsInfo((v) => {
      const nv = structuredClone(v);
      nv.push({ teamTitle: '', role: '', teamUid: '' });
      return nv;
    });
  };

  const onDeleteTeam = (index: number) => {
    setTeamsInfo((old) => {
      const newItem = [...old];
      newItem.splice(index, 1);
      return newItem;
    });
  };

  const onClearTeamSearch = (index: number) => {
    setTeamsInfo((old) => {
      old[index] = { teamTitle: '', role: '', teamUid: '' };
      return [...old];
    });
  };

  const onTeamSelectionChanged = (index: number, item: any) => {
    setTeamsInfo((old) => {
      const newV = structuredClone(old);
      newV[index].teamTitle = item.teamTitle;
      newV[index].teamUid = item.teamUid;
      return [...newV];
    });
  };

  const onRoleChange = (index: number, value: string) => {
    setTeamsInfo((old) => {
      old[index].role = value;
      return [...old];
    });
  };

  const getAvailableTeamOptions = () => {
    const selectedTeamUids = [...teamsinfo].filter((v) => v.teamUid !== '').map((v) => v.teamUid);
    const remainingItems = [...teamOptions].filter((v) => !selectedTeamUids.includes(v.teamUid));
    return [...remainingItems];
  };

  const onAddSkill = (newSelectedOption: any) => {
    setSelectedSkills((v: any[]) => {
      return [...v, newSelectedOption];
    });
  };

  const onRemoveSkill = (item: any) => {
    setSelectedSkills((old: any[]) => {
      const newItems = [...old].filter((v) => v.id !== item.id);
      return newItems;
    });
  };

  useEffect(() => {
    function resetHandler() {
      setTeamsInfo(initialValues.teamsAndRoles);
      setSelectedSkills(initialValues.skills)
    }
    document.addEventListener('reset-member-register-form', resetHandler);
    return function () {
      document.removeEventListener('reset-member-register-form', resetHandler);
    };
  }, [initialValues]);

  return (
    <>
      <div className="msf">
        {/**************  ERRORS  ************/}
        <ul className="msf__errors">
          {errors.map((error: string, index: number) => (
            <li key={`member-error-${index}`}>{error}</li>
          ))}
        </ul>
        {/**************  TEAMS & ROLES UI  *****************/}
        <div className="msf__tr">
          <div className="msf__tr__head">
            <p className="msf__tr__head__item">Team*</p>
            <p className="msf__tr__head__item">Role*</p>
          </div>
          <div className="msf__tr__content">
            {teamsinfo.map((teaminfo, index) => (
              <div key={`teams-role-${index}`} className="msf__tr__content__cn">
                <div className="msf__tr__content__cn__teams">
                  <SearchableSingleSelect
                    id="members-register-team-info"
                    isMandatory={true}
                    placeholder="Select a team"
                    displayKey="teamTitle"
                    options={getAvailableTeamOptions()}
                    selectedOption={teaminfo}
                    uniqueKey="teamUid"
                    formKey="teamTitle"
                    name={`teamInfo${index}-teamTitle`}
                    onClear={() => onClearTeamSearch(index)}
                    onChange={(item) => onTeamSelectionChanged(index, item)}
                    arrowImgUrl="/icons/arrow-down.svg"
                  />
                  <HiddenField value={teaminfo.teamUid} defaultValue="" name={`teamInfo${index}-teamUid`} />
                </div>
                <div className="msf__tr__content__cn__role">
                  <TextField id="register-member-role" value={teaminfo.role} isMandatory={true} name={`teamInfo${index}-role`} placeholder="Enter your title/role" onChange={(e) => onRoleChange(index, e.target.value)} type="text" />
                </div>
                <div className="msf__tr__content__cn__delete">
                  {index !== 0 && (
                    <button className="msf__tr__content__cn__delete__btn" onClick={() => onDeleteTeam(index)} type="button">
                      <Image src="/icons/close.svg" alt="delete team role" width="18" height="18" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {teamOptions.length !== teamsinfo.length && (
              <div className="msf__tr__add">
                <button className="msf__tr__add__btn" type="button" onClick={onAddTeam}>
                  <Image src="/icons/add.svg" width="16" height="16" alt="Add New" />
                  <span>Add team and role</span>
                </button>
              </div>
            )}
          </div>
          <div className="msf__tr__info">
            <img src="/icons/info.svg" />
            <p>If you don&apos;t see your team on this list please add your team first by using &apos;Join the network&apos; - &apos;As a Team&apos;</p>
          </div>
        </div>

        {/**************  SKILLS UI  *****************/}
        <div className="msf__ps">
          <MultiSelect
            options={skillsOptions}
            selectedOptions={selectedSkills}
            onAdd={onAddSkill}
            onRemove={onRemoveSkill}
            uniqueKey="id"
            displayKey="name"
            label="Professional skills*"
            placeholder="Select applicable skills"
            isMandatory={true}
            closeImgUrl="/icons/close.svg"
            arrowImgUrl="/icons/arrow-down.svg"
          />
          <div className="msf__tr__info">
            <img src="/icons/info.svg" />
            <p>Sharing your skills help other network members & teams connect with you.</p>
          </div>
          {selectedSkills.map((skillInfo, index) => (
            <div key={`member-skills-${index}`}>
              <HiddenField value={skillInfo.name} defaultValue="" name={`skillsInfo${index}-title`} />
              <HiddenField value={skillInfo.id} defaultValue="" name={`skillsInfo${index}-uid`} />
            </div>
          ))}
        </div>
      </div>
      <style jsx>
        {`
          .msf {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
        .msf__errors {
            color: red;
            font-size: 12px;
            padding: 0 16px 16px 16px;
          }
          .msf__tr__head {
            display: flex;
            margin-bottom: 12px;
            align-items: center;
            justify-content: left;
            gap: 20px;
            width: 100%;
          }
          .msf__tr__head__item {
            width: calc(50% - 30px);
            font-weight: 600;
            font-size: 14px;
          }
          .msf__tr__info {
            display: flex;
            color: #94a3b8;
            font-size: 13px;
            font-weight: 400;
            align-items: flex-start;
            gap: 4px;
            margin-top: 12px;
          }
          .msf__tr__content {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .msf__tr__content__cn {
            display: flex;
            align-items: center;
            justify-content: left;
            gap: 8px;
            width: 100%;
          }
          .msf__tr__content__cn__teams {
            width: calc(50% - 18px);
          }
          .msf__tr__content__cn__role {
            width: calc(50% - 18px);
          }
          .msf__tr__add {
            width: fit-content;
            margin-top: 4px;
          }
          .msf__tr__add__btn {
            background: none;
            font-weight: 500;
            font-size: 14px;
            color: #156ff7;
            outline: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: left;
            width: 100%;
            gap: 4px;
          }
          .msf__tr__content__cn__delete__btn {
            background: none;
            outline: none;
            border: none;
            cursor: pointer;
          }
          .msf__ps {
            margin: 20px 0;
          }
          .msf__ps__head {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
          }
        `}
      </style>
    </>
  );
}

export default MemberSkillsInfo;
