import Modal from '@/components/core/modal';
import { useRef } from 'react';

function ActionRequired() {
  const actionReqModalRef = useRef<HTMLDialogElement>(null);

  const onRefresh = () => window.location.reload();

  const onCloseActionReqModal = () => {
    actionReqModalRef.current?.close();
  };

  const onClickHere = () => {
    if (actionReqModalRef.current) {
      actionReqModalRef.current.showModal();
    }
  };
  return (
    <>
      <div className="action__required">
        <div className="action__required__fr">
          <div className="action__required__fr__left">
            <img className="action__required__fr__left__req__img" src="/icons/info-blue.svg" />
            <div className="action__required__fr__left__attention">Attention Required</div>
          </div>
          <div className="action__required__fr__right" onClick={onRefresh}>
            <img className="action__required__fr__right_refresh__img" src="/icons/refresh-blue.svg" />
            <div className="action__required__fr__right__refresh">Refresh</div>
          </div>
        </div>
        <p className="action__required__info">
          Please
          <span className="action__required__info__click" onClick={onClickHere}>
            click here
          </span>
          to complete a required step on telegram. Once completed reload the page or click refresh.
        </p>
      </div>
      <Modal modalRef={actionReqModalRef} onClose={onCloseActionReqModal}>
        <div className="action__required___modal">
          Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley
          of type and scrambled it to make a type specimen boo
        </div>
      </Modal>
      <style jsx>
        {`
          .action__required {
            background: #dbeafe;
            padding: 12px;
            border-radius: 8px;
          }
          .action__required__info {
            font-size: 14px;
            font-weight: 400;
            color: #000000;
            line-height: 24px;
            margin-top: 4px;
          }
          .action__required__info__click {
            color: #156ff7;
            cursor: pointer;
            padding: 0 5px;
          }
          .action__required__fr {
            display: flex;
            justify-content: space-between;
          }
          .action__required__fr__left {
            display: flex;
          }
          .action__required__fr__right {
            display: flex;
            cursor: pointer;
          }
          .action__required__fr__left__attention {
            font-size: 14px;
            font-weight: 600;
            color: #000000;
            line-height: 24px;
            margin-left: 5px;
          }
          .action__required__fr__right__refresh {
            font-size: 14px;
            font-weight: 500;
            color: #156ff7;
            line-height: 24px;
            margin-left: 5px;
          }
          .action__required___modal {
            width: 50vw;
            background: #ffffff;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 85vh;
          }
        `}
      </style>
    </>
  );
}

export default ActionRequired;
