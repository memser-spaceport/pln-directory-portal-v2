import SingleSelect from '@/components/form/single-select';
import TextArea from '@/components/form/text-area';
import TextField from '@/components/form/text-field';
import { DIDNTHAPPENEDOPTIONS, TECHNICALISSUESOPTIONS, TROUBLES_INFO } from '@/utils/constants';
import { Fragment, SetStateAction, useEffect, useState } from 'react';
import OfficeHoursMultiSelect from './office-hours-multi-select';
import HiddenField from '@/components/form/hidden-field';
import { IFollowUp } from '@/types/officehours.types';

interface Option {
  [key: string]: any;
}

interface ITroubleSection {
  onTroubleOptionClickHandler: (name: string) => void;
  troubles: string[];
  setErrors: SetStateAction<any>;
  currentFollowup: IFollowUp | null;
  onMultiSelectClicked: () => void;
}



const TroubleSection = (props: ITroubleSection) => {
  const onTroubleOptionClickHandler = props.onTroubleOptionClickHandler;
  const troubles = props?.troubles ?? [];
  const setErrors = props?.setErrors;
  const currentFollowup = props?.currentFollowup;
  const onMultiSelectClicked = props?.onMultiSelectClicked

  const [selectedDidntHappenedOption, setSelectedDidntHappenedOption] = useState('');
  const [selectedTechnicalIssues, setSelectedTechnicalIssues] = useState<string[]>([]);

  const onDidntHapppenedOptionClickHandler = (option: Option | null) => {
    setErrors([]);
    setSelectedDidntHappenedOption(option?.name);
  };

  const onTechnicalIssueClickHandler = (issue: Option) => {
    setErrors([]);
    if (selectedTechnicalIssues.includes(issue.name)) {
      const filteredIssues = [...selectedTechnicalIssues].filter((techIssue) => techIssue !== issue.name);
      setSelectedTechnicalIssues([...filteredIssues]);
      return;
    }
    setSelectedTechnicalIssues([...selectedTechnicalIssues, issue.name]);
  };


  const reset = () => {
    setSelectedDidntHappenedOption("");
    setSelectedTechnicalIssues([]);
  }

  useEffect(() => {
    reset();
  }, [currentFollowup])

  return (
    <>
      <div className="trblesec">
        {/* Title */}
        <div className="trblesec__titlctr">
          <img alt="info" src="/icons/info-outline.svg" />
          <span className="trblesec__titlctr__ttl">Did you experience any issues with the meeting?</span>
        </div>

     {/* Technial issue */}
     <div className="trblesec__techisue">
          <div className="trblesec__techisue__optn">
            <div className="trblesec__techisue__chckbox">
              {troubles?.includes(TROUBLES_INFO.technicalIssues.name) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTechnicalIssues([]);
                    onTroubleOptionClickHandler(TROUBLES_INFO.technicalIssues.name);
                  }}
                  className="trblesec__techisue__optn__chckbox__sltdbtn"
                >
                  <img alt="tick" src="/icons/right-white.svg" />
                </button>
              )}

              {!troubles?.includes(TROUBLES_INFO.technicalIssues.name) && (
                <button type="button" onClick={() => onTroubleOptionClickHandler(TROUBLES_INFO.technicalIssues.name)} className="trblesec__techisue__optn__chckbox__notsltdbtn"></button>
              )}
            </div>
            <div className="trblesec__techisue__optn__cnt">Faced technical issues</div>
          </div>

          {troubles?.includes(TROUBLES_INFO.technicalIssues.name) && (
            <div className="trblesec__techisue__ddown">
              <OfficeHoursMultiSelect side="top" onMultiSelectedClick={onMultiSelectClicked} displayKey="name" items={TECHNICALISSUESOPTIONS} selectedItems={selectedTechnicalIssues} onItemSelect={onTechnicalIssueClickHandler} />
            </div>
          )}

          {selectedTechnicalIssues.includes('Other') && (
            <div className="trblesec__didnthpn__ddown__othrctr">
              <div className="trblesec__didnthpn__ddown__othrctr__ttl">Specify other reason(s)*</div>{' '}
              <TextArea isMandatory={true} maxLength={1000} name={'technnicalIssueReason'} id={'reason'} placeholder="Enter Details Here" />
            </div>
          )}

          {selectedTechnicalIssues?.map((technicalIssue: string, index: number) => (
            <Fragment key={`${technicalIssue}-${index}`}>
              <HiddenField value={technicalIssue ?? ''} defaultValue={technicalIssue ?? ''} name={`technicalIssue-${index}`} />
            </Fragment>
          ))}
        </div>
        {/* Didn't happen */}
        <div className="trblesec__didnthpn">
          <div className="trblesec__didnthpn__optn">
            <div className="trblesec__didnthpn__optn__chckbox">
              {troubles?.includes(TROUBLES_INFO.didntHappened.name) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDidntHappenedOption('');
                    onTroubleOptionClickHandler(TROUBLES_INFO.didntHappened.name);
                  }}
                  className="trblesec__didnthpn__optn__chckbox__sltdbtn"
                >
                  <img src="/icons/right-white.svg" />
                </button>
              )}

              {!troubles?.includes(TROUBLES_INFO.didntHappened.name) && (
                <button type="button" onClick={() => onTroubleOptionClickHandler(TROUBLES_INFO.didntHappened.name)} className="trblesec__didnthpn__optn__chckbox__notsltdbtn"></button>
              )}
            </div>
            <div className="trblesec__didnthpn__optn__cnt">Meeting didn’t happen</div>
          </div>

          {troubles?.includes(TROUBLES_INFO.didntHappened.name) && (
            <div className="trblesec__didnthpn__ddown">
              <SingleSelect
              onSingleSelectClicked={onMultiSelectClicked}
                displayKey="name"
                arrowImgUrl="/icons/arrow-down.svg"
                id="didnthappendReason"
                onItemSelect={onDidntHapppenedOptionClickHandler}
                options={[...DIDNTHAPPENEDOPTIONS]}
                selectedOption={selectedDidntHappenedOption}
                uniqueKey="didnthappendReason"
                placeholder="Select reason"
              />

              {selectedDidntHappenedOption === 'Got rescheduled' && (
                <div>
                  <TextField  isMandatory={true} defaultValue={''} id="register-member-startDate" label="" name="scheduledAt" type="date" placeholder="Select Date" />
                </div>
              )}

              {selectedDidntHappenedOption === 'Other' && (
                <div className="trblesec__didnthpn__ddown__othrctr">
                  <div className="trblesec__didnthpn__ddown__othrctr__ttl">Specify other reason(s)*</div>{' '}
                  <TextArea isMandatory={true} maxLength={1000} name={'didntHappenedReason'} id={'reason'} placeholder="Enter Details Here" />
                </div>
              )}
            </div>
          )}
          <HiddenField value={selectedDidntHappenedOption} defaultValue={selectedDidntHappenedOption} name={`didntHappenedOption`} />
        </div>

   
      </div>

      <style jsx>
        {`
          .trblesec {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 14px;
            background-color: #f1f5f9;
            border-radius: 8px;
          }

          .trblesec__titlctr {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .trblesec__titlctr__ttl {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .trblesec__didnthpn {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .trblesec__didnthpn__optn {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .trblesec__didnthpn__optn__cnt {
            font-size: 14px;
            font-weight: 400;
            display: flex;
            align-items: center;
            line-height: 20px;
          }

          .trblesec__didnthpn__optn__chckbox {
            height: 20px;
          }

          .trblesec__techisue__chckbox {
            height: 20px;
          }

          .trblesec__didnthpn__ddown {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .trblesec__didnthpn__ddown__othrctr {
            margin-top: 2px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .trblesec__didnthpn__ddown__othrctr__ttl {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .trblesec__didnthpn__optn__chckbox__sltdbtn {
            background-color: #156ff7;
            border-radius: 4px;
            display: flex;
            align-items: center;
            height: 20px;
            width: 20px;
            justify-content: center;
          }

          .trblesec__didnthpn__optn__chckbox__notsltdbtn {
            border: 1px solid #cbd5e1;
            height: 20px;
            width: 20px;
            border-radius: 4px;
          }

          .trblesec__techisue {
            display: flex;
            gap: 8px;
          }

          .trblesec__techisue__optn {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .trblesec__techisue__optn__cnt {
            font-size: 14px;
            font-weight: 400;
            display: flex;
            align-items: center;
            line-height: 20px;
          }

          .trblesec__techisue__optn__chckbox {
            height: 20px;
          }

          .trblesec__techisue__optn__chckbox__sltdbtn {
            background-color: #156ff7;
            border-radius: 4px;
            display: flex;
            align-items: center;
            height: 20px;
            width: 20px;
            justify-content: center;
          }

          .trblesec__techisue__optn__chckbox__notsltdbtn {
            border: 1px solid #cbd5e1;
            height: 20px;
            width: 20px;
            border-radius: 4px;
          }

          .trblesec__techisue__ddown {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .trblesec__techisue {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
        `}
      </style>
    </>
  );
};

export default TroubleSection;
