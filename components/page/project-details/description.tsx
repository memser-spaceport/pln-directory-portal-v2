'use client';

import TextEditor from '@/components/ui/text-editor';
import { updateProject } from '@/services/projects.service';
import { getAnalyticsUserInfo, getParsedValue, triggerLoader } from '@/utils/common.utils';
import Image from 'next/image';
import { useState } from 'react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useProjectAnalytics } from '@/analytics/project.analytics';

interface IDescription {
  description: string;
  project: any;
  userHasEditRights: boolean;
  user: any;
}

const Description = (props: IDescription) => {
  const contentLength = 347;
  /**
   * @description - This is the state to store the description content without trimming.
   */
  const [description,setDescription] = useState(props?.description ?? '');
  /**
   * @unChangedDescription - This is the state to store the description content before editing.
   */
  const [unChangedDescription,setUnChangedDescription] = useState(props?.description ?? '');
  const project = props?.project;
  const analytics = useProjectAnalytics();
  const isDeleted = project?.isDeleted ?? false;
  const [showEditor, setEditor] = useState(false);
  const getContent = (cnt:string) => {
    if (cnt.length > contentLength) {
      return cnt.substring(0, contentLength) + '...';
    }
    return cnt;
  }
  /**
   * @desc - This is the state to store the description content truncated.
   */
  const [desc, setDesc] = useState(getContent(description));

  const onShowMoreClickHandler = () => {
    analytics.onProjectDetailDescShowMoreClicked(getAnalyticsUserInfo(props?.user), project?.id);
    setDesc(description);
  };

  const onCancelClickHandler = () => {
    analytics.onProjectDetailDescEditCancelClicked(getAnalyticsUserInfo(props?.user), project?.id);
    setEditor(false);
    setDescription(unChangedDescription);
    setDesc(getContent(unChangedDescription));
  };

  const onShowLessClickHandler = () => {
    analytics.onProjectDetailDescShowLessClicked(getAnalyticsUserInfo(props?.user), project?.id);
    setDesc(getContent(desc));
  };

  const onEditClickHandler = () => {
    setUnChangedDescription(description);
    setEditor(true);
     analytics.onProjectDetailDescEditClicked(getAnalyticsUserInfo(props?.user), project?.id);
  };

  const onSaveClickHandler = async () => {
    if(description === ''){
      toast.error("Description field cannot be empty");
      return;
    }
    setEditor(false);
    triggerLoader(true);
    analytics.onProjectDetailDescEditSaveClicked(getAnalyticsUserInfo(props?.user), project?.id);
    try {
      const authToken = getParsedValue(Cookies.get('authToken') ?? '');
      if (!authToken) {
        return;
      }
      const res = await updateProject(project?.id, { ...project,description: description }, authToken);
      if (res.status === 200 || res.status === 201) {
        setDescription(description);
        setDesc(getContent(description));
        triggerLoader(false);
        toast.success('Description updated successfully.');
        analytics.recordDescSave('save-success', getAnalyticsUserInfo(props?.user), { ...project,description: description });
      }
    } catch (er) {
      triggerLoader(false);
      analytics.recordDescSave('save-error', getAnalyticsUserInfo(props?.user), { ...project,description: description });
      toast.error('Something went wrong. Please try again later.');
    } finally {
      triggerLoader(false);
    }
  };
  return (
    <>
      {desc && (
        <div className="desc">
          <div className="desc__header">
            <h6 className="desc__header__title">Description</h6>
            {!showEditor && props?.userHasEditRights && !isDeleted && (
              <button className="desc__header__edit" onClick={onEditClickHandler}>
                Edit
                {/* <Image src="/icons/edit.svg" alt="Edit" height={16} width={16} /> */}
              </button>
            )}
            {showEditor && (
              <div className="desc__header__action">
                <button className="desc__header__action__cancel" onClick={onCancelClickHandler}>
                  <span className="desc__header__action__cancel__txt">Cancel</span>
                </button>
                <button className="desc__header__action__save" onClick={onSaveClickHandler}>
                  <span className="desc__header__action__save__txt">Save</span>
                </button>
              </div>
            )}
          </div>
          {showEditor && (
            <div className="desc__content">
              <TextEditor text={description} setContent={setDescription} />
            </div>
          )}
          {!showEditor && (
            <div className="desc__content">
              {/* {description} */}
              <div dangerouslySetInnerHTML={{ __html: desc }} />
              {description?.length > desc?.length && (
                <span>
                  <button className="desc__content__show-more" onClick={onShowMoreClickHandler}>
                    show more{' '}
                    <span className="desc__content__show-more__icon">
                      <Image src="/icons/chevron-up.svg" alt="Edit" height={12} width={12} />
                    </span>
                  </button>
                </span>
              )}
              {description?.length > contentLength && description === desc && (
                <span>
                  &nbsp;
                  <button className="desc__content__show-less" onClick={onShowLessClickHandler}>
                    show less
                    <span className="desc__content__show-more__icon">
                      <Image src="/icons/showless.svg" alt="Edit" height={12} width={12} />
                    </span>
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
      <style jsx>{`
        .desc {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .desc__header__title {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #64748b;
        }

        .desc__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .desc__header__edit {
          display: flex;
          font-size: 14px;
          font-weight: 500;
          color: #156ff7;
          align-items: center;
          height: fit-content;
          background: none;
          border: none;
          white-space: nowrap;
          gap: 8px;
        }

        .desc__content {
          font-size: 15px;
          font-weight: 400;
          line-height: 24px;
          letter-spacing: 0em;
          color: #0f172a;
          word-break: break-word;
          overflow: hidden;
          position: relative;
          // word-wrap: break-word; /* Allow long words to be broken and wrapped */
          // word-break: break-all;
        }

        .desc__content__show-more__icon {
          top: 2px;
          position: relative;
          width: 12px;
          height: 12px;
          display: inline-block;
          margin-left: 4px;
        }
        .desc__content__show-more {
          color: #156ff7;
          font-size: 14px;
          font-weight: 500;
          line-height: 14px;
          padding: 0;
          border: none;
          background-color: #fff;
          // float: right;
        }

        .desc__content__show-less {
          color: #156ff7;
          font-size: 14px;
          font-weight: 500;
          line-height: 14px;
          padding: 0;
          border: none;
          background-color: #fff;
          // float: right;
        }

        .desc__header__action__cancel {
          padding: 8px 16px;
          background: white;
          border: 1px solid #156ff7;
          border-radius: 8px;
        }

        .desc__header__action__cancel__txt {
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          text-align: left;
          color: #156ff7;
        }

        .desc__header__action__save {
          padding: 8px 16px;
          background: white;
          border: 1px solid #156ff7;
          border-radius: 8px;
          background: #156ff7;
        }

        .desc__header__action__save__txt {
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          text-align: left;
          color: white;
        }
        .desc__header__action {
          display: flex;
          gap: 8px;
        }
      `}</style>
    </>
  );
};

export default Description;
