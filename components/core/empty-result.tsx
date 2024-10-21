"use client";

import { usePathname, useRouter } from "next/navigation";

const EmptyResult = (props: any) => {
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = props?.isLoggedIn;

  const onClearAllClickHandler = () => {
    router.push(pathname);
  };

  
  return (
    <>
      <div className="data-not-found">
        <p className="data-not-found__content">
          There are no results for your criteria. You can try to define different criteria or {" "}
          <span onClick={onClearAllClickHandler} className="data-not-found__content__clear-all">
            clear all the criteria.
          </span>
          {!isLoggedIn && <span> If you&apos;re unable to find your project, please login to add a project.</span>}
          {isLoggedIn && <span> If you&apos;re unable to find your project, <a className="data-not-found__content__addpro" href="/projects/add">click here </a> to add a project.</span>}
        </p>
      </div>

      <style jsx>
        {`
            .data-not-found {
                margin-top: 31px;
                display: flex;
                width: inherit;
                justify-content: center;
            }

            .data-not-found__content {
                color: #475569;
                width: 300px;
                text-align: center;
                font-size: 14px;
                font-weight: 400;
                line-height: 20px;
            }

            .data-not-found__content__clear-all {
                cursor: pointer;
            }

            .data-not-found__content__clear-all {
                color: #156FF7;
            }

            .data-not-found__content__addpro {
            color: #156FF7;}

          @media (min-width: 1024px) {
            .data-not-found__content {
                width: 417px;
            }
          }


            .`}
      </style>
    </>
  );
};

export default EmptyResult;
