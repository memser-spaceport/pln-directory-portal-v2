'use client';

import { useMemberAnalytics } from '@/analytics/members.analytics';
import TextEditor from '@/components/ui/text-editor';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { useState } from 'react';
import clip from 'text-clipper';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { updateMember, updateMemberBio } from '@/services/members.service';
import { ADMIN_ROLE } from '@/utils/constants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const Bio = ({ member, userInfo }: { member: any; userInfo: any }) => {
  const contentLength = 347;
  
  const [content, setContent] = useState(member?.bio ?? '');
  const isOwner = userInfo?.uid === member.id;
  const isAdmin = userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE);
  // const [clippedHtml,setClippedHtml] = useState(clip(content, contentLength, { html: true, maxLines: 5 }));

  const analytics = useMemberAnalytics();

  /**
   * @showEditor - This is the state to show/hide the editor.
   */
  const [showEditor, setEditor] = useState(false);
  const router = useRouter();

  /**
   * To get the trimmed content to be displayed
   * @param cnt Content to be trimmed and displayed
   * @returns trimmed content
   */
  const getContent = (cnt: string) => {
    if (cnt.length > contentLength) {
      return cnt.substring(0, contentLength) + '...';
    }
    return cnt;
  };

  /**
   * @clippedContent - This is the state to store the content to be displayed
   */
  const [clippedContent, setClippedContent] = useState(getContent(content));

  const onShowMoreClickHandler = () => {
    analytics.onMemberDetailsBioReadMoreClicked(getAnalyticsMemberInfo(member));
    setClippedContent(content);
  };

  const onShowLessClickHandler = () => {
    analytics.onMemberDetailsBioReadLessClicked(getAnalyticsMemberInfo(member));
    setClippedContent(getContent(content));
  };

  const onEditClickHandler = () => {
    setEditor(true);
    analytics.onMemberDetailsBioEditClicked(getAnalyticsMemberInfo(member), getAnalyticsUserInfo(userInfo));
  };

  const onCancelClickHandler = () => {
    analytics.onMemberDetailsBioEditCancelClicked(getAnalyticsMemberInfo(member), getAnalyticsUserInfo(userInfo));
    setContent(member?.bio ?? '');
    setClippedContent(clip(member?.bio ?? '', contentLength));
    setEditor(false);
  };

  const onSaveClickHandler = async () => {
    // if(content === ''){
    //   toast.error('Bio cannot be empty');
    //   return;
    // }
    setEditor(false);
    analytics.onMemberDetailsBioEditSaveClicked(getAnalyticsMemberInfo(member), getAnalyticsUserInfo(userInfo));
    try {
      triggerLoader(true);
      const copymember = { ...member };
      copymember.projectContributions.map((project: any) => {
        delete project.project;
        return project;
      });
      // const payload = {
      //   participantType: 'MEMBER',
      //   referenceUid: member.id,
      //   uniqueIdentifier: member.email,
      //   newData: { name: member.name, 
      //     imageUid: member.imageUid,
      //     email: member.email, teamAndRoles: member.teamAndRoles, projectContributions: copymember.projectContributions, skills: member.skills, bio: content },
      // };

      const payload = {
        bio: content
      }

      const rawToken = Cookies.get('authToken');
      if (!rawToken) {
        return;
      }
      const authToken = JSON.parse(rawToken);
      const { data, isError, errorMessage, errorData } = await updateMemberBio(member.id, payload, authToken);
      triggerLoader(false);
      if (isError) {
        if (errorData?.message && errorData?.message === 'Email already exists. Please try again with different email') {
          toast.error('Email already exists. Please try again with different email');
        } else {
          toast.error('People update failed. Something went wrong, please try again later');
        }
        analytics.recordBioSave('save-error', getAnalyticsMemberInfo(member), getAnalyticsUserInfo(userInfo));
      } else {
        setContent(content);
        router.refresh();
        setClippedContent(clip(content, contentLength));
        analytics.recordBioSave('save-success', getAnalyticsMemberInfo(member), getAnalyticsUserInfo(userInfo));
        toast.success('People updated successfully');
        // window.location.href = `/settings/members?id=${selectedMember.uid}`;
      }
    } catch (e) {
      triggerLoader(false);
      toast.error('People update failed. Something went wrong, please try again later');
      analytics.recordBioSave('save-error', getAnalyticsMemberInfo(member), getAnalyticsUserInfo(userInfo));
    }
  };

  return (
    <>
      <div className="bioCn">
        <div className="bioCn__header">
          <h2 className="bioCn__ttl">Bio</h2>
          {!showEditor && (isAdmin || isOwner) && (
            <button className="bioCn__ttl__header__edit" onClick={onEditClickHandler}>
              Edit
              {/* <Image src="/icons/edit.svg" alt="Edit" height={16} width={16} /> */}
            </button>
          )}
          {showEditor && (
            <div className="bioCn__header__action">
              <button className="bioCn__header__action__cancel" onClick={onCancelClickHandler}>
                <span className="bioCn__header__action__cancel__txt">Cancel</span>
              </button>
              <button className="bioCn__header__action__save" onClick={onSaveClickHandler}>
                <span className="bioCn__header__action__save__txt">Save</span>
              </button>
            </div>
          )}
        </div>
        {!showEditor && (
          <div>
            <div className="bioCn__content" dangerouslySetInnerHTML={{ __html: clippedContent }} />
            {content?.length > clippedContent?.length && (
              <button className="bioCn__content__show-more" onClick={onShowMoreClickHandler}>
                show more{' '}
                <span className="bioCn__content__show-more__icon">
                      <Image src="/icons/chevron-up.svg" alt="Edit" height={12} width={12} />
                    </span>
              </button>
            )}
            {content?.length > contentLength && content === clippedContent && (
              <button className="bioCn__content__show-less" onClick={onShowLessClickHandler}>
                show less
                <span className="bioCn__content__show-more__icon">
                      <Image src="/icons/showless.svg" alt="Edit" height={12} width={12} />
                    </span>
              </button>
            )}
          </div>
        )}
        {showEditor && (
          <div className="bioCn__content">
            <TextEditor text={content} setContent={setContent} />
          </div>
        )}
      </div>

      <style jsx>{`
        .bioCn {
          border-top: 1px solid #cbd5e1;
          padding: 16px;
        }

        .bioCn__ttl {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          // margin-bottom: 10px;
        }

        .bioCn__content {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #000000;
          display: inline;
          overflow: hidden;
            position: relative;
            // word-wrap: break-word; /* Allow long words to be broken and wrapped */
            // word-break: break-all;
        }

        .bioCn__ttl__header__edit {
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

        .bioCn__toggle-btn {
          font-size: 14px;
          font-weight: 500;
          line-height: 22px;
          text-align: center;
          color: #156ff7;
          background: transparent;
          font-style: italic;
        }

        .desc {
          display: inline-block;
        }
        .bioCn__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
        }
          .bioCn__content__show-more__icon {
            top: 2px;
            position: relative;
            width: 12px;
            height: 12px;
            display: inline-block;
            margin-left: 4px;
          }

        @media (min-width: 1024px) {
          .bioCn {
            padding: 20px;
          }

          .desc {
            display: none;
          }
        }
        .bioCn__header__action__cancel {
          padding: 8px 16px;
          background: white;
          border: 1px solid #156ff7;
          border-radius: 8px;
        }

        .bioCn__header__action__cancel__txt {
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          text-align: left;
          color: #156ff7;
        }

        .bioCn__header__action__save {
          padding: 8px 16px;
          background: white;
          border: 1px solid #156ff7;
          border-radius: 8px;
          background: #156ff7;
        }

        .bioCn__header__action__save__txt {
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          text-align: left;
          color: white;
        }
        .bioCn__header__action {
          display: flex;
          gap: 8px;
        }
        .bioCn__content__show-more {
          color: #156ff7;
          font-size: 14px;
          font-weight: 500;
          line-height: 14px;
          padding: 0;
          border: none;
          background-color: #fff;
          // float: right;
        }

        .bioCn__content__show-less {
          color: #156ff7;
          font-size: 14px;
          font-weight: 500;
          line-height: 14px;
          padding: 0;
          border: none;
          background-color: #fff;
          // float: right;
        }
      `}</style>
    </>
  );
};

export default Bio;
