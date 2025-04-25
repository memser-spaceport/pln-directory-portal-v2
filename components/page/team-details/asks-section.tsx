'use client';

import AddEditAsk from '@/components/core/addAsks/add-edit-asks';
import Modal from '@/components/core/modal';
import { triggerLoader } from '@/utils/common.utils';
import { EVENTS } from '@/utils/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { getAnalyticsTeamInfo } from '@/utils/common.utils';
import { Tooltip } from '../../core/tooltip/tooltip';
import { CloseAskDialog } from '@/components/core/close-ask-dialog';

interface IAsksSection {
  asks: any[];
  hasEditAsksAccess: boolean;
  team: any;
}

const initialSelectedAsk = {
  title: '',
  description: '',
  tags: [],
  uid: '',
  teamUid: '',
};

const AsksSection = (props: IAsksSection) => {
  const initialAsks = props?.asks;
  const team = props?.team;
  const formRef: any = useRef(null);
  const deleteModalRef: any = useRef(null);

  const analytics = useTeamAnalytics();
  const hasEditAsksAccess = props?.hasEditAsksAccess ?? false;

  const [allAsks, setAllAsks]: any = useState(initialAsks ?? []);

  const [type, setType] = useState('Add');
  const [isAddAsk, setIsAddAsk] = useState(false);
  const [allErrors, setAllErrors]: any = useState([]);
  const [selectedAsk, setSelectedAsk] = useState(initialSelectedAsk);
  const [showCloseAskDialog, setShowCloseAskDialog] = useState(false);

  const onAddAsksClickHandler = () => {
    setIsAddAsk(true);
    analytics.teamDetailShareyourAsksClicked(getAnalyticsTeamInfo(team));
    setType('Add');
  };

  const onAsksCloseClickHandler = () => {
    setIsAddAsk(false);
    document.dispatchEvent(new CustomEvent(EVENTS.RESET_ASK_FORM_VALUES));
    formRef.current.reset();
  };

  const onFormSubmitHandler = async (e: any) => {
    e.preventDefault();
    try {
      const isAddMode = type === 'Add';
      const formData = new FormData(formRef.current);
      const formattedData = transformObject(Object.fromEntries(formData));

      const validateForm = (data: any) => {
        const errors: string[] = [];
        if (!data.title) errors.push('Title');
        if (!data.description?.length) errors.push('Description');
        if (!data.tags?.length) errors.push('Tags');
        return errors;
      };

      const errors = validateForm(formattedData);
      if (errors.length > 0) {
        setAllErrors(errors);
        return;
      } else {
        setAllErrors([]);
      }

      // Reset form and trigger UI events
      setIsAddAsk(false);
      document.dispatchEvent(new CustomEvent(EVENTS.RESET_ASK_FORM_VALUES));
      formRef.current.reset();
      triggerLoader(true);

      // Fetch data
      const { authToken } = getCookiesFromClient();
      const url = `${process.env.DIRECTORY_API_URL}/v1/teams/${team.id}/ask`;
      const payload = isAddMode ? { ask: formattedData, teamName: team?.name } : { ask: { ...formattedData, uid: selectedAsk.uid }, teamName: team?.name };

      const response = await customFetch(
        url,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        },
        true,
      );

      if (response?.ok) {
        if (isAddMode) {
          analytics.teamDetailSubmitAskClicked(getAnalyticsTeamInfo(team), payload.ask);
        } else {
          analytics.teamDetailUpdateAskClicked(getAnalyticsTeamInfo(team), payload.ask);
        }
        toast.success(isAddMode ? 'Ask added successfully' : 'Ask edited successfully');

        const teamResponse = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams/${team.id}`, { cache: 'no-store' });

        if (teamResponse?.ok) {
          const result = await teamResponse.json();
          setAllAsks([...result.asks]);
        }
      } else {
        toast.error('Something went wrong!');
      }
    } catch (e) {
      toast.error('Something went wrong!');
      console.error(e);
    } finally {
      triggerLoader(false);
    }
  };

  function transformObject(object: Record<string, string | File>): any {
    let result: any = {};
    const tags: any = [];

    for (const key in object) {
      if (key.startsWith('askTag')) {
        const askTagIndexMatch = key.match(/askTag(\d+)-name/);
        if (askTagIndexMatch && object[key]) {
          const askTagIndex = askTagIndexMatch[1];
          tags[askTagIndex] = object[key];
        }
      } else if (key === 'title' || key === 'description') {
        result[key] = object[key];
      }
    }
    result.tags = tags;
    return result;
  }

  const onEditAskClickHandler = (ask: any) => {
    setSelectedAsk((e: any) => {
      return {
        title: ask.title,
        tags: ask.tags,
        description: ask.description,
        uid: ask.uid,
        teamUid: ask.teamUid,
      };
    });
    setIsAddAsk(true);
    setType('Edit');
    analytics.teamDetailEditAskClicked(getAnalyticsTeamInfo(team), {
      title: ask.title,
      tags: ask.tags,
      description: ask.description,
      uid: ask.uid,
      teamUid: ask.teamUid,
    });
  };

  const onCloseAskClickHandler = (ask: any) => {
    setSelectedAsk((e: any) => {
      return {
        title: ask.title,
        tags: ask.tags,
        description: ask.description,
        uid: ask.uid,
        teamUid: ask.teamUid,
      };
    });
    setShowCloseAskDialog(true);

    // todo - add close ask analytics
    // analytics.teamDetailEditAskClicked(getAnalyticsTeamInfo(team), {
    //   title: ask.title,
    //   tags: ask.tags,
    //   description: ask.description,
    //   uid: ask.uid,
    //   teamUid: ask.teamUid,
    // });
  };

  const onDeleteClickHandler = async (id: string) => {
    setIsAddAsk(false);
    deleteModalRef.current?.showModal();
    analytics.teamDetailDeleteAskClicked(getAnalyticsTeamInfo(team), selectedAsk);
  };

  const onDeleteConfirmationClose = () => {
    deleteModalRef.current?.close();
  };

  const onDeleteAsk = async () => {
    try {
      deleteModalRef.current?.close();
      triggerLoader(true);
      document.dispatchEvent(new CustomEvent(EVENTS.RESET_ASK_FORM_VALUES));
      formRef?.current?.reset();
      const { authToken } = getCookiesFromClient();
      const payload = {
        ask: { ...selectedAsk, isDeleted: true },
        teamName: team?.name,
      };
      const response = await customFetch(
        `${process.env.DIRECTORY_API_URL}/v1/teams/${team.id}/ask`,
        {
          cache: 'no-store',
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        },
        true,
      );
      if (response?.ok) {
        analytics.teamDetailDeleteAskConfirmClicked(getAnalyticsTeamInfo(team), { ...payload.ask, teamName: payload.teamName });
        toast.success('Ask deleted successfully');
        const teamResponse = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams/${team.id}`, {
          cache: 'no-store',
        });
        if (!teamResponse?.ok) {
          triggerLoader(false);
          return;
        }
        const result = await teamResponse.json();
        const asksFromApi = result.asks;
        triggerLoader(false);
        setAllAsks([...asksFromApi]);
      } else {
        toast.error('Something went wrong!');
        triggerLoader(false);
      }
    } catch (e) {
      console.error(e);
      triggerLoader(false);
    }
  };
  return (
    <>
      <div className="asksec">
        <div className="asksec__hdr">
          <div className="asksec__hdr__lft">
            <h2 className="asksec__hdr__ttl">Asks</h2>
            {allAsks.length > 0 && (
              <Tooltip
                asChild
                trigger={<img src="/icons/info.svg" height={16} />}
                content={
                  <p style={{ padding: '8px' }}>
                    Asks are specific requests for help or resources that your team needs to achieve your next milestones. Use this space to connect with others who can contribute their expertise,
                    networks, or resources to support your project.
                  </p>
                }
              />
            )}
          </div>

          {allAsks.length > 0 && allAsks.length < 3 && hasEditAsksAccess && (
            <button className="asksec__hdr__addask" onClick={onAddAsksClickHandler}>
              Submit Asks
            </button>
          )}
        </div>

        {allAsks.length === 0 && (
          <div className="asksec__desc">
            <p className="asksec__desc__txt">
              Asks are specific requests for help or resources that your team needs to achieve your next milestones. Use this space to connect with others who can contribute their expertise, networks,
              or resources to support your project.
            </p>
            {hasEditAsksAccess && (
              <button className="asksec__desc__addask" onClick={onAddAsksClickHandler}>
                Submit Asks
              </button>
            )}
          </div>
        )}
        {allAsks.length > 0 && (
          <div className="asksec__allasks">
            {allAsks.map((ask: any, index: number) => (
              <div key={`${ask.uid}+${index}`} className="asksec__allasks__ask">
                <div className="asksec__allasks__ask__hdr">
                  <p className="asksec__allasks__ask__hdr__ttl">{ask.title}</p>
                  {hasEditAsksAccess && (
                    <div className="aslsec__allasks__ask__hdr__controls">
                      <button onClick={() => onEditAskClickHandler(ask)} className="asksec__allasks__ask__hdr__edit">
                        Edit
                      </button>
                      <div className="aslsec__allasks__ask__hdr__separator" />
                      <button onClick={() => onCloseAskClickHandler(ask)} className="asksec__allasks__ask__hdr__edit">
                        Close
                      </button>
                    </div>
                  )}
                </div>
                <div className="asksec__allasks__ask__cont" dangerouslySetInnerHTML={{ __html: ask.description }} />
                <div className="asksec__allasks__ask__tags">
                  {ask?.tags?.map((tag: string, index: number) => (
                    <div key={`${tag}+${index}`} className="asksec__allasks__ask__tags__tag">
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddEditAsk
        formRef={formRef}
        type={type}
        errors={allErrors}
        setErrors={setAllErrors}
        remainingAsks={3 - allAsks.length}
        formValues={selectedAsk}
        isAddAsk={isAddAsk}
        onClose={onAsksCloseClickHandler}
        onSubmit={onFormSubmitHandler}
        onDeleteClickHandler={onDeleteClickHandler}
      />

      <CloseAskDialog
        data={selectedAsk}
        isVisible={showCloseAskDialog}
        onClose={() => {
          setShowCloseAskDialog(false);
          setSelectedAsk(initialSelectedAsk);
        }}
      />

      <Modal modalRef={deleteModalRef} onClose={onDeleteConfirmationClose}>
        <div className="dcm">
          <div className="dcm__header">Are you sure you want to delete your asks?</div>
          <div className="dcm__body">
            <p className="dcm__body__desc">Clicking delete will remove your asks</p>
          </div>
          <div className="dcm__footer">
            <button type="button" className="dcm__footer__cncl" onClick={onDeleteConfirmationClose}>
              Cancel
            </button>

            <button type="button" onClick={onDeleteAsk} className="dcm__footer__dlt">
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <style jsx>
        {`
          button {
            background: inherit;
          }
          .asksec {
          }

          .asksec__hdr {
            display: flex;
            width: 100%;
            justify-content: space-between;
          }

          .asksec__hdr__ttl {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          .asksec__hdr__lft {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .asksec__desc {
            display: flex;
            flex-direction: column;
            margin-top: 4px;
            gap: 22px;
          }

          .asksec__hdr__addask {
            color: #156ff7;
            height: fit-content;
            width: fit-content;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            white-space: nowrap;
          }

          .asksec__desc__addask {
            padding: 10px 24px;
            color: #ffffff;
            height: fit-content;
            white-space: nowrap;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            border-radius: 8px;
            background: #156ff7;
            height: fit-content;
            width: fit-content;
          }

          .asksec__desc__txt {
            color: #64748b;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          .aasksec__allasks {
            margin-top: 16px;
          }

          .asksec__allasks__ask {
            margin-top: 16px;
            border-width: 1px 0px 0px 0px;
            border-style: solid;
            border-color: #e2e8f0;
            padding: 16px 0px 0px 0px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .asksec__allasks__ask__hdr {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .asksec__allasks__ask__hdr__ttl {
            font-size: 14px;
            font-weight: 600;
            line-height: 24px;
          }

          .aslsec__allasks__ask__hdr__controls {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .aslsec__allasks__ask__hdr__separator {
            height: 16px;
            border-right: 1px solid #e2e8f0;
          }

          .asksec__allasks__ask__hdr__edit {
            color: #156ff7;
            background: inherit;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          .asksec__allasks__ask__cont {
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          .asksec__allasks__ask__tags {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
          }

          .asksec__allasks__ask__tags__tag {
            padding: 6px 12px;
            border-radius: 24px;
            background: #f1f5f9;
            color: #475569;
            font-weight: 500;
            font-size: 12px;
            line-height: 14px;
          }

          .dcm {
            padding: 24px;
            width: 320px;
            display: flex;
            flex-direction: column;
            gap: 18px;
            //   height: 60vh;
            overflow: auto;
            border-radius: 12px;
            background: #fff;
          }

          .dcm__header {
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
            letter-spacing: 0em;
            color: #0f172a;
          }

          .dcm__body__desc {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            letter-spacing: 0px;
            color: #0f172a;
          }

          .dcm__footer {
            display: flex;
            flex-direction: column-reverse;
            gap: 10px;
            padding: 10px 0px;
          }

          .dcm__footer__cncl,
          .dcm__footer__dlt {
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            background: inherit;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          .dcm__footer__dlt {
            background: #dd2c5a;
            color: white;
          }
          @media (min-width: 1024px) {
            .asksec__desc {
              flex-direction: row;
              align-items: center;
            }

            .dcm {
              width: 656px;
            }

            .dcm__footer {
              flex-direction: row;
              justify-content: end;
              gap: 10px;
            }
          }
        `}
      </style>
    </>
  );
};

export default AsksSection;
