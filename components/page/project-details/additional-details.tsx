"use client";

import Cookies from "js-cookie";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "md-editor-rt/lib/style.css";
import { IAnalyticsUserInfo } from "@/types/shared.types";
import { triggerLoader } from "@/utils/common.utils";
import { updateProject } from "@/services/projects.service";

const MdEditor = dynamic(() =>
  import("md-editor-rt").then((mod) => mod.MdEditor),
);
const MdPreview = dynamic(() =>
  import("md-editor-rt").then((mod) => mod.MdPreview),
);

interface IAdditionalDetails {
  project: any;
  userHasEditRights: boolean;
  authToken: string;
  user: IAnalyticsUserInfo;
}

export const AdditionalDetails = (props: IAdditionalDetails) => {
  const project = props?.project;
  const isDeleted = project?.isDeleted ?? false;
  const userHasEditRights = props?.userHasEditRights;
  const initialReadme = project?.readMe;
  const authToken = props?.authToken;
  const user = props?.user;

  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [isTeamOftheProject, setTeamOftheProject] = useState(false);
  const [text, setText] = useState(initialReadme);

  // const {
  //   onAdditionalDetailEditClicked,
  //   onAdditionalDetailEditSaveClicked,
  //   onAdditionalDetailEditCancelClicked,
  //   onAdditionalDetailEdit,
  // } = useProjectDetailAnalytics();

  const onEditAction = () => {
    // onAdditionalDetailEditClicked(user, project?.uid, project?.name);
    setIsEditorVisible(true);
  };

  const onCancelAction = () => {
    // onAdditionalDetailEditCancelClicked(user, project?.uid, project?.name);
    setText(initialReadme);
    setIsEditorVisible(false);
  };

  const onSaveAction = async () => {
    triggerLoader(true);
    // onAdditionalDetailEditSaveClicked(user, project?.uid, project?.name);
    try {
      const res = await updateProject(
        project?.uid,
        { readMe: text },
        authToken,
      );
      if (res.status === 200 || res.status === 201) {
        triggerLoader(false);
        // onAdditionalDetailEdit(user, "success", project?.uid, project?.name);
        toast.success("Additional Details updated successfully.");
      }
    } catch (er) {
      triggerLoader(false);
      // onAdditionalDetailEdit(user, "failed", project?.uid, project?.name);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      triggerLoader(false);
    }
    setIsEditorVisible(false);
  };

  useEffect(() => {
    const userInfoFromCookie = Cookies.get("userInfo");
    if (userInfoFromCookie) {
      const parsedUserInfo = JSON.parse(userInfoFromCookie);
      if (
        parsedUserInfo?.leadingTeams?.length > 0 &&
        parsedUserInfo?.leadingTeams?.includes(project.maintainingTeamUid)
      ) {
        setTeamOftheProject(true);
      }
    }
  }, []);

  return (
    <>
      <div className="addDetails">
        <div className="addDetails__hdr">
          <h6 className="addDetails__hdr__title">Additional Details</h6>
          {!isDeleted &&
            userHasEditRights &&
            !isEditorVisible &&
            initialReadme && (
              <button className="addDetails__hdr__edit" onClick={onEditAction}>
                Edit
              </button>
            )}
          {isEditorVisible && (
            <div className="addDetails__hdr__actions">
              <button
                className="addDetails__hdr__actions__save"
                onClick={onSaveAction}
              >
                Save
              </button>
              <button
                className="addDetails__hdr__actions__cancel"
                onClick={onCancelAction}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {!isEditorVisible && !initialReadme && (
          <div className="addDetails__preview__nodetails">
            No additional details added.
            {isTeamOftheProject && (
              <span>
                <span
                  className="addDetails__preview__nodetails__text"
                  onClick={onEditAction}
                >
                  {" "}
                  Click Here{" "}
                </span>
                to add additional details (markdown supported).
              </span>
            )}
          </div>
        )}
        <div className="addDetails__preview">
          {!isEditorVisible && initialReadme && (
            <MdPreview
              className="addDetails__preview__editor"
              modelValue={text}
            />
          )}
        </div>
        {isEditorVisible && (
          <div>
            <MdEditor
              modelValue={text}
              onChange={setText}
              language={"en-US"}
              toolbarsExclude={["catalog", "github", "save", "htmlPreview"]}
            />
          </div>
        )}
      </div>
      <style jsx>{`
        .addDetails {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .addDetails__hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .addDetails__hdr__title {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #64748b;
        }

        .addDetails__hdr__edit,
        .addDetails__hdr__actions__save,
        .addDetails__hdr__actions__cancel {
          font-size: 15px;
          line-height: 24px;
          color: #156ff7;
          font-weight: 600;
        }

        .addDetails__hdr__actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .addDetails__preview {
          all: revert;
        }

        .addDetails__preview__nodetails {
          border-width: 1px;
          border-radius: 12px;
          padding: 16px 16px 16px 0px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.12px;
          color: #0f172a;
        }

        .addDetails__preview__nodetails__text {
          color: #156ff7;
          cursor: pointer;
        }
      `}</style>
    </>
  );
};
