"use client";

import { useState } from "react";
import DeleteConfirmationModal from "./delete-confirmation-modal";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { IAnalyticsUserInfo } from "@/types/shared.types";
import { triggerLoader } from "@/utils/common.utils";
import { deleteProject } from "@/services/projects.service";
import { Tooltip } from "@/components/core/tooltip/tooltip";


interface IHeader {
  project: any;
  userHasDeleteRights: boolean;
  userHasEditRights: boolean;
  user: IAnalyticsUserInfo;
  authToken: string;
}

const Header = (props: IHeader) => {
  const project = props?.project;
  const name = project?.name ?? "";
  const tagline = project?.tagline ?? "";
  const lookingForFunding = project?.lookingForFunding ?? false;
  const userHasDeleteRights = props?.userHasDeleteRights ?? false;
  const userHasEditRights = props?.userHasEditRights ?? false;
  const id = project?.uid ?? "";
  const isDeleted = project?.isDeleted ?? false;
  const user = props?.user;
  const authToken = props?.authToken;

  const [isOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const onOpenDeleteModal = () => {
    // onDeleteButtonClicked(user, project?.uid, project?.name);
    setIsModalOpen(true);
  };

  const onCloseModal = () => {
    // onDeleteCancelButtonClicked(user, project?.uid, project?.name);
    setIsModalOpen(false);
  };

  const onEditProject = () => {
    triggerLoader(true);
    // onEditButtonClicked(user, project?.uid, project?.name);
    router.push(`/projects/update/${id}`);
  };

  const onDeleteProject = async () => {
    // onDeleteConfirmButtonClicked(user, project?.uid, project?.name);
    triggerLoader(true);
    try {
      const res = await deleteProject(id, authToken);
      if (res.status === 200) {
        triggerLoader(false);
        // onProjectDelete(user, "success", project?.uid, project?.name);
        toast.success("Project deleted successfully.");
        setIsModalOpen(false);
        router.push("/projects");
        router.refresh();
      }
    } catch (err) {
      triggerLoader(false);
      // onProjectDelete(user, "failed", project?.uid, project?.name);
      setIsModalOpen(false);
      console.error(err);
    }
  };

  return (
    <>
      <div className="header">
        <div className="header__profile">
          <img
            className="header__profile__img"
            src={project?.logo?.url ?? "/icons/default-project.svg"}
            alt="logo"
          />
        </div>
        <div className="header__details">
          <div className="header__details__specifics">
            <div className="header__details__specifics__hdr">
              <Tooltip
                asChild
                content={name}
                trigger={
                  <h1 className="header__details__specifics__name">{name}</h1>
                }
              />
            </div>
            <p className="header__details__specifics__desc">{tagline}</p>
          </div>
          <div className="header__details__controls">
            {/* <button className="header__details__controls__notice__button">
              <img src="/icons/notification.svg" alt="notification icon" />
            </button> */}
            {!isDeleted && (
              <>
                {userHasEditRights && (
                  <button
                    className="header__details__controls__edit"
                    onClick={onEditProject}
                  >
                    <img
                      width={14}
                      height={14}
                      src="/icons/edit-blue.svg"
                      alt="edit icon"
                    />
                    <span>Edit</span>
                  </button>
                )}
                {userHasDeleteRights && (
                  <button
                    onClick={onOpenDeleteModal}
                    className="header__details__controls__delete"
                  >
                    <img
                      width={14}
                      height={14}
                      src="/icons/delete.svg"
                      alt="delete icon"
                    />
                    <span>Delete</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="header__tags">
          {lookingForFunding && (
            <div className="header__tags__funds">
              <img src="/icons/moneybag.svg" alt="icon" />
              <span className="header__tags__funds__text">Raising Funds</span>
            </div>
          )}
        </div>
      </div>
      {isOpen && (
        <DeleteConfirmationModal
          onClose={onCloseModal}
          onDeleteProject={onDeleteProject}
        />
      )}
      <style jsx>{`
        .header {
          display: grid;
          grid-template-columns: 48px auto;
          column-gap: 8px;
        }

        .header__profile {
          grid-row: span 2 / span 2;
        }

        .header__profile__img {
          width: 48px;
          height: 48px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
        }

        .header__details {
          display: flex;
          gap: 10px;
          justify-content: space-between;
          grid-row: span 2 / span 2;
          grid-column: span 4 / span 4;
          margin-bottom: 16px;
        }

        .header__details__specifics__hdr {
          height: 40px;
          display: flex;
          align-items: center;
        }

        .header__details__specifics__name {
          font-size: 16px;
          font-weight: 700;
          line-height: 16px;
          letter-spacing: 0em;
          color: #0f172a;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          max-width: 200px;
        }

        .header__details__specifics__desc {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          letter-spacing: 0px;
          color: #0f172a;
          word-break: break-word;
        }

        .header__details__controls {
          display: flex;
          gap: 16px;
          align-items: self-start;
        }

        .header__details__controls__notice__button {
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header__tags {
          grid-row: span 1 / span 1;
          grid-column: span 5 / span 5;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .header__tags__funds__text {
          font-size: 12px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #475569;
        }

        .header__tags__funds {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: #f1f5f9;
          border-radius: 56px;
          padding: 1px 8px 1px 0px;
        }

        .header__details__controls__edit {
          color: #156ff7;
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          letter-spacing: 0em;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .header__details__controls__delete {
          color: #ff6038;
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          letter-spacing: 0em;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .header__details__controls__edit span,
        .header__details__controls__delete span {
          display: none;
        }

        @media (min-width: 1024px) {
          .header {
            grid-template-columns: 80px auto;
            column-gap: 24px;
          }

          .header__profile {
            grid-row: span 3 / span 3;
          }

          .header__profile__img {
            height: 80px;
            width: 80px;
          }

          .header__details {
            grid-row: span 2 / span 2;
            grid-column: 2 / auto;
            margin-bottom: unset;
          }

          .header__tags {
            grid-row: span 1 / span 1;
            grid-column: 2 / auto;
            border-top: unset;
            padding: 16px 0px 0px 0px;
          }

          .header__details__controls__edit span,
          .header__details__controls__delete span {
            display: block;
          }
        }
      `}</style>
    </>
  );
};

export default Header;
