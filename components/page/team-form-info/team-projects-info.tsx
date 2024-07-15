'use client'
import HiddenField from '@/components/form/hidden-field';
import MultiSelect from '@/components/form/multi-select';
import SingleSelect from '@/components/form/single-select';
import { useEffect, useRef, useState } from 'react';
import FocusAreasList from './focus-area/focus-area-list';
import FocusAreasPopup from './focus-area/focus-areas-popup';
import Modal from '@/components/core/modal';

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
  errors: string[];
  focusAreas?: any[];
  initialValues: any;
  showFocusArea?: boolean;
}

const TeamProjectsInfo = (props: ITeamProjectsInfo) => {
  const initialValues = props?.initialValues;
  const protocolOptions = props?.protocolOptions;
  const fundingStageOptions = props?.fundingStageOptions;
  const membershipResourceOptions = props?.membershipSourceOptions;
  const industryTagOptions = props?.industryTagOptions;
  const showFocusArea = props.showFocusArea ?? false;
  const focusAreas = props?.focusAreas ?? [];
  const errors = props?.errors;
  const focusAreaDialogRef = useRef<HTMLDialogElement>(null);
  const [selectedProtocols, setSelectedProtocols] = useState<IProtocolOptions[]>([]);
  const [selectedMembershipSources, setSelectedMembershipSources] = useState<IMembershipSourceOptions[]>([]);
  const [selectedIndustryTags, setSelectedIndustryTags] = useState<IIndustryTagsOptions[]>([]);
  const [selectedFundingStage, setSelectedFundingStage] = useState<IFundingStage | null>({...initialValues.fundingStage});
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<any[]>([])

  const [isFocusAreaModalOpen, setIsFocusAreaModalOpen] = useState(false);

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

  const onFocusAreaChanged = (items: any[]) => {
    setSelectedFocusAreas([...items])
  }
  const onEditFocusArea =() => {
    setIsFocusAreaModalOpen(true)
    if (focusAreaDialogRef.current) {
      focusAreaDialogRef.current.showModal()
    }
  }

  const onFocusAreaClose = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    setIsFocusAreaModalOpen(false);
    if (focusAreaDialogRef.current) {
       focusAreaDialogRef.current.close();
    }
  }
  const onTeamSelectionChanged = (item: any) => {
    setSelectedFundingStage(item);
  };

  useEffect(() => {
    setSelectedProtocols([...initialValues.technologies])
    setSelectedMembershipSources([...initialValues.membershipSources])
    setSelectedIndustryTags([...initialValues.industryTags])
    setSelectedFundingStage({...initialValues.fundingStage})
    setSelectedFocusAreas([...initialValues?.teamFocusAreas ?? []])
    function resetHandler() {
      setSelectedProtocols(structuredClone(initialValues.technologies));
      setSelectedMembershipSources(structuredClone(initialValues.membershipSources));
      setSelectedIndustryTags(structuredClone(initialValues.industryTags));
      setSelectedFundingStage(structuredClone(initialValues.fundingStage));
      setSelectedFocusAreas([...initialValues?.teamFocusAreas ?? []]);
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
            {errors.map((error:string, index: number) => {
              return (
                <li className="teamProject__form__errs__err" key={`team-err-${index}`}>
                  {error}
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
              <div key={`team-technologies-${protocol.id}-${index}`}>
                <HiddenField value={protocol.name} defaultValue={protocol.name} name={`technology${index}-title`} />
                <HiddenField value={protocol.id}  defaultValue={protocol.id} name={`technology${index}-uid`} />
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
          <HiddenField value={selectedFundingStage?.id} defaultValue={selectedFundingStage?.id ?? ''} name="fundingStage-uid" />
          <HiddenField value={selectedFundingStage?.name} defaultValue={selectedFundingStage?.name ?? ''} name="fundingStage-title" />
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
              <div key={`team-membershipSource-${source.id}-${index}`}>
                <HiddenField value={source.name} defaultValue={source.name} name={`membershipSource${index}-title`} />
                <HiddenField value={source.id} defaultValue={source.id} name={`membershipSource${index}-uid`} />
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
              <div key={`team-industryTags-${tag.id}-${index}`}>
                <HiddenField value={tag.name} defaultValue={tag.name}   name={`industryTag${index}-title`} />
                <HiddenField value={tag.id} defaultValue={tag.id}   name={`industryTag${index}-uid`} />
              </div>
            ))}
          </div>
        </div>
        {showFocusArea && <div className="teamProject__form__item">
            <FocusAreasList onOpen={onEditFocusArea} selectedItems={[...selectedFocusAreas]} rawData={[...focusAreas]}/>
            <div className="info">
            <img src="/icons/info.svg" />
            <p>Protocol Labs&apos;s vision for the future is built on core focus areas that aim to harness humanity&apos;s potential for good, navigate potential pitfalls, and ensure a future where technology empowers humanity.</p>
          </div>
            {selectedFocusAreas.map((area, index) => (
              <div key={`team-teamFocusAreas-${area.uid}-${index}`}>
                <HiddenField value={area.title} defaultValue={area.title}   name={`teamFocusAreas${index}-title`} />
                <HiddenField value={area.uid} defaultValue={area.uid}   name={`teamFocusAreas${index}-uid`} />
              </div>
            ))}
        </div>}
      </div>
      <Modal onClose={onFocusAreaClose} modalRef={focusAreaDialogRef}>
         {isFocusAreaModalOpen && <FocusAreasPopup handleFoucsAreaSave={onFocusAreaChanged}  onClose={onFocusAreaClose} selectedItems={selectedFocusAreas} focusAreas={[...focusAreas]}/>}
      </Modal>
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
          visibility: hidden;
          height:0;
          width:0;
        }
      `}</style>
    </>
  );
};

export default TeamProjectsInfo;
