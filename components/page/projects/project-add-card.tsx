"use client";

import { triggerLoader } from "@/utils/common.utils";
import { VIEW_TYPE_OPTIONS } from "@/utils/constants";
import Link from "next/link";
// import { CommonUtils } from "../../../../../../utils";
import { useRouter } from "next/navigation";

const ProjectAddCard = (props: any) => {
  // props
  const viewType = props?.viewType;

  //variable
  const router = useRouter();

  //method
  const onAddClick = () => {
    triggerLoader(true);
  };

  return (
    <>
      <Link
        type="button"
        href="/projects/add"
        onClick={onAddClick}
        prefetch={false}
        className={`projectcard ${viewType === VIEW_TYPE_OPTIONS.LIST ? "projectcard--list" : ""}`}
      >
        <img src="/icons/add.svg" alt="add" />
        <p className="projectcard__add">Add Project</p>
        <p className="projectcard__text">List your project here</p>
      </Link>
      <style jsx>
        {`
          .projectcard {
            margin-bottom: 8px;
            width: 289px;
            background-color: #fff;
            border-radius: 12px;
            border: 1px #156ff7;
            border-style: dashed;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 24px;
            height: 285px;
          }

          .projectcard--list {
            width: 100%;
            height: 112px;
          }

          .projectcard:hover {
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .projectcard__add {
            font-weight: 500;
            font-size: 16px;
            line-height: 26px;
            color: #156ff7;
          }

          .projectcard__text {
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #64748b;
          }
        `}
      </style>
    </>
  );
};

export default ProjectAddCard;
