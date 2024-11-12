import TextEditor from '@/components/ui/text-editor';
import BioAction from './bio-action-buttons';

export default function BioEditor({ onCancelClickHandler, onSaveClickHandler, bioEditMode, content, setContent }: any) {
  return (
    <>
      <div className="bioCn__header">
        <div className="bioCn__ttl bioCn__ttl__add">Enter your bio details below</div>
        <div className="bioCn__ttl__header__action">
          <BioAction onCancelClickHandler={onCancelClickHandler} onSaveClickHandler={onSaveClickHandler} bioEditMode={bioEditMode} />
        </div>
      </div>
      <div className="bioCn__content">
        <TextEditor text={content} setContent={setContent} />
        <div className="bioCn__content__action">
          <BioAction onCancelClickHandler={onCancelClickHandler} onSaveClickHandler={onSaveClickHandler} bioEditMode={bioEditMode} />
        </div>
      </div>
      <style jsx>{`
        .bioCn__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
        }

        .bioCn__ttl__header__action {
          visibility: hidden;
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
        .bioCn__content__action {
          visibility: visible;
          justify-content: flex-end;
          display: flex;
        }
        @media (min-width: 426px) {
          .bioCn__ttl__header__action {
            visibility: visible;
          }
          .bioCn__content__action {
            visibility: hidden;
          }
        }
      `}</style>
    </>
  );
}
