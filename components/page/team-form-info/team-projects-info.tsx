import HiddenField from '@/components/form/hidden-field';
import MultiSelect from '@/components/form/multi-select';
import SingleSelect from '@/components/form/single-select';
import { useEffect, useState } from 'react';

interface ICommonProperties {
  id: string;
  name: string;
}

interface IProtocolOptions extends ICommonProperties {}
interface IFundingStage extends ICommonProperties {}
interface IMembershipSourceOptions extends ICommonProperties {}
interface IIndustryTagsOptions extends ICommonProperties {}
interface ITeamProjectsInfo {
  protocolOptions: IProtocolOptions[];
  fundingStageOptions: IFundingStage[];
  membershipSourceOptions: IMembershipSourceOptions[];
  industryTagOptions: IIndustryTagsOptions[];
  errors: { key: string; message: string }[];
  initialValues: any;
}

const TeamProjectsInfo = (props: ITeamProjectsInfo) => {
  const initialValues = props?.initialValues;
  const protocolOptions = props?.protocolOptions;
  const fundingStageOptions = props?.fundingStageOptions;
  const membershipResourceOptions = props?.membershipSourceOptions;
  const industryTagOptions = props?.industryTagOptions;
  const errors = props?.errors;
  const [selectedProtocols, setSelectedProtocols] = useState<IProtocolOptions[]>(initialValues.technologies);
  const [selectedMembershipSources, setSelectedMembershipSources] = useState<IMembershipSourceOptions[]>(initialValues.membershipSources);
  const [selectedIndustryTags, setSelectedIndustryTags] = useState<IIndustryTagsOptions[]>(initialValues.industryTags);
  const [selectedFundingStage, setSelectedFundingStage] = useState<IFundingStage>(initialValues.fundingStage);

  const addItem = (setState: React.Dispatch<React.SetStateAction<any[]>>, itemToAdd: any) => {
    setState((prevItems: any[]) => {
      return [...prevItems, itemToAdd];
    });
  };

  const removeItem = (setState: React.Dispatch<React.SetStateAction<any[]>>, itemToRemove: any) => {
    setState((prevItems: any[]) => {
      const newItems = prevItems.filter((item) => item.id !== itemToRemove.id);
      return newItems;
    });
  };

  const onTeamSelectionChanged = (item: any) => {
    setSelectedFundingStage(item);
  };

  useEffect(() => {
    function resetHandler() {
      setSelectedProtocols(initialValues.technologies);
      setSelectedMembershipSources(initialValues.membershipSources);
      setSelectedIndustryTags(initialValues.industryTags);
      setSelectedFundingStage(initialValues.fundingStage);
    }
    document.addEventListener('reset-team-register-form', resetHandler);
    return function () {
      document.removeEventListener('reset-team-register-form', resetHandler);
    };
  }, [initialValues]);

  return (
    <>
      <div className="teamProject__form">
        {errors.length > 0 && (
          <ul className="teamProject__form__errs">
            {errors.map((error: { key: string; message: string }, index: number) => {
              return (
                <li className="teamProject__form__errs__err" key={`${error.key}-${index}`}>
                  {error?.message}
                </li>
              );
            })}
          </ul>
        )}
        <div className="teamProject__form__item">
          <MultiSelect
            options={protocolOptions}
            selectedOptions={selectedProtocols}
            onAdd={(itemToAdd) => addItem(setSelectedProtocols, itemToAdd)}
            onRemove={(itemToRemove) => removeItem(setSelectedProtocols, itemToRemove)}
            uniqueKey="id"
            displayKey="name"
            label="Protocol"
            placeholder="Search Protocol(s)"
            isMandatory={false}
            closeImgUrl="/icons/close.svg"
            arrowImgUrl="/icons/arrow-down.svg"
          />
          <div className="info">
            <img src="/icons/info.svg" />
            <p>Does your team/project use any of these protocol(s)?</p>
          </div>
          <div className="hidden">
            {selectedProtocols.map((protocol, index) => (
              <div key={`team-technologies-${index}`}>
                <HiddenField value={protocol.name} defaultValue="" name={`technology${index}-title`} />
                <HiddenField value={protocol.id} defaultValue="" name={`technology${index}-uid`} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <SingleSelect
            id="teams-fundingstage"
            isMandatory={true}
            placeholder="Select a Stage"
            uniqueKey="id"
            displayKey="name"
            options={fundingStageOptions}
            selectedOption={selectedFundingStage}
            onItemSelect={(item) => onTeamSelectionChanged(item)}
            arrowImgUrl="/icons/arrow-down.svg"
            label="Funding Stage*"
          />
          <HiddenField value={selectedFundingStage?.id} defaultValue="" name="fundingStage-uid" />
          <HiddenField value={selectedFundingStage?.name} defaultValue="" name="fundingStage-title" />
        </div>
        <div className="teamProject__form__item">
          <MultiSelect
            options={membershipResourceOptions}
            selectedOptions={selectedMembershipSources}
            onAdd={(itemToAdd) => addItem(setSelectedMembershipSources, itemToAdd)}
            onRemove={(itemToRemove) => removeItem(setSelectedMembershipSources, itemToRemove)}
            uniqueKey="id"
            displayKey="name"
            label="Membership Source"
            placeholder="Select the Membership Sources"
            isMandatory={false}
            closeImgUrl="/icons/close.svg"
            arrowImgUrl="/icons/arrow-down.svg"
          />
          <div className="hidden">
            {selectedMembershipSources.map((source, index) => (
              <div key={`team-membershipSource-${index}`}>
                <HiddenField value={source.name} defaultValue="" name={`membershipSource${index}-title`} />
                <HiddenField value={source.id} defaultValue="" name={`membershipSource${index}-uid`} />
              </div>
            ))}
          </div>
        </div>
        <div className="teamProject__form__item">
          <MultiSelect
            options={industryTagOptions}
            selectedOptions={selectedIndustryTags}
            onAdd={(itemToAdd) => addItem(setSelectedIndustryTags, itemToAdd)}
            onRemove={(itemToRemove) => removeItem(setSelectedIndustryTags, itemToRemove)}
            uniqueKey="id"
            displayKey="name"
            label="Industry Tags*"
            placeholder="Search the Industry Tags"
            isMandatory
            closeImgUrl="/icons/close.svg"
            arrowImgUrl="/icons/arrow-down.svg"
          />
          <div className="info">
            <img src="/icons/info.svg" />
            <p>Add industries that you had worked in. This will make it easier for people to find & connect based on shared professional interests.</p>
          </div>
          <div className="hidden">
            {selectedIndustryTags.map((tag, index) => (
              <div key={`team-industryTags-${index}`}>
                <HiddenField value={tag.name} defaultValue="" name={`industryTag${index}-title`} />
                <HiddenField value={tag.id} defaultValue="" name={`industryTag${index}-uid`} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        .teamProject__form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px 0px;
        }
        .teamProject__form__item {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .teamProject__form__errs {
          display: grid;
          gap: 4px;
          padding-left: 16px;
        }
        .teamProject__form__errs__err {
          color: #ef4444;
          font-size: 12px;
          line-height: 16px;
        }
        .info {
          display: flex;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 400;
          align-items: flex-start;
          gap: 4px;
        }
        .hidden {
          display: none;
        }
      `}</style>
    </>
  );
};

export default TeamProjectsInfo;
