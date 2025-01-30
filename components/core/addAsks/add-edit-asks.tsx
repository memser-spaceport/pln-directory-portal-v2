import { ReactNode, useEffect, useRef, useState } from 'react';
import Modal from '../modal';
import TextField from '@/components/form/text-field';
import TextEditor from '@/components/ui/text-editor';
import { DEFAULT_ASK_TAGS } from '@/utils/constants';
import useClickedOutside from '@/hooks/useClickedOutside';
import HiddenField from '@/components/form/hidden-field';
import { EVENTS } from '@/utils/constants';
import Image from 'next/image';

interface IAddEditAsks {
  onClose: (e?: any) => void;
  onSubmit: any;
  isAddAsk: any;
  formValues: any;
  remainingAsks: number;
  type: string;
  formRef: any;
  onDeleteClickHandler: any;
  errors: any;
  setErrors: any;
}

const AddEditAsk = (props: IAddEditAsks) => {
  const isAddAsk = props?.isAddAsk;
  const formRef = props?.formRef;
  const onClose = props?.onClose;
  const type = props?.type;
  const onFormSubmitHandler = props?.onSubmit;
  const remainingAsks = props?.remainingAsks;
  const defaultValues = props?.formValues;
  const onDeleteClickHandler = props?.onDeleteClickHandler;
  const askId = defaultValues.uid;
  const errors = props?.errors;
  const setErrors = props?.setErrors;

  const tagSearchRef: any = useRef(null);
  const bodyRef: any = useRef(null);
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState(defaultValues?.tags ?? []);
  const [isTagsDropdown, setIsTagsDropdown] = useState(false);
  const [filteredTags, setFilteredTags] = useState(defaultValues?.tags ?? []);

  useClickedOutside({ callback: () => setIsTagsDropdown(false), ref: tagSearchRef });

  const onTitleChangeHandler = (e: any) => {
    setTitle(e.target.value);
    setErrors((prev: any) => {
      return prev.filter((error: string) => error !== 'Title');
    });
  };

  const onEditorChange = (value: string) => {
    setDescription(value);
    setErrors((prev: any) => {
      return prev.filter((error: string) => error !== 'Description');
    });
  };

  const onTagsChangeHandler = (e: any) => {
    const inputValue = e.target.value.trim().toLowerCase();
    setFilteredTags((prev: any) => {
      const availableTags = DEFAULT_ASK_TAGS.filter((tag: string) => tag.toLowerCase().includes(inputValue));
      return availableTags.filter((tag) => !tags.includes(tag));
    });
  };

  const onTagsKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
    if (e.key === 'Backspace' && e.target.value === '') {
      setTags((prevItems: any) => prevItems.slice(0, -1));
      setFilteredTags((prev: any) => {
        const finalTags = [...prev, tags[tags.length - 1]];
        return DEFAULT_ASK_TAGS.filter((defaultTag: string) => finalTags.includes(defaultTag) );
      });
    }
  };

  const onTagSectionClickHandler = () => {
    setIsTagsDropdown(true);
    setFilteredTags((prev: any) => {
      return DEFAULT_ASK_TAGS.filter((initialTag: string) => (!tags.includes(initialTag)));
    });

    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      const formContainer = document.getElementById('addaskform');

      if (formContainer) {
        formContainer.scrollTo({ top: formContainer.scrollHeight, left: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const onTagClicHandler = (tag: string) => {
    const allTags = [...tags, tag];
    setIsTagsDropdown(true);
    tagSearchRef.current.value = '';
    setFilteredTags(() => DEFAULT_ASK_TAGS.filter((defaultTag: string) => !allTags.includes(defaultTag)));
    setTags((prev: string) => [...prev, tag]);
    setErrors((error: string) => {
      return errors.filter((err: string) => err !== 'Tags');
    });
  };

  const onTagRemoveClickhandler = (tag: string) => {
    setTags((prev: string[]) => {
      return prev.filter((previousTag: string) => previousTag !== tag);
    });
  };

  const onFormSubmit = (e: any) => {
    onFormSubmitHandler(e);
  };

  useEffect(() => {
    setTitle(defaultValues?.title ?? '');
    setTags(defaultValues?.tags ?? []);
    setDescription(defaultValues.description ?? '');
    setFilteredTags(DEFAULT_ASK_TAGS.filter((defaultTag: string) => !defaultValues?.tags?.includes(defaultTag)))
  }, [defaultValues]);

  useEffect(() => {
    const resetFormValues = () => {
      setTitle('');
      setTags([]);
      setDescription('');
      setFilteredTags(DEFAULT_ASK_TAGS);
      setErrors([]);
    };
    document.addEventListener(EVENTS.RESET_ASK_FORM_VALUES, (e) => resetFormValues());
    return document.removeEventListener(EVENTS.RESET_ASK_FORM_VALUES, () => resetFormValues());
  }, []);

  useEffect(() => {
    if (isAddAsk) {
      setTimeout(() => {
        const formContainer = document.getElementById('addaskform');

        if (formContainer) {
          formContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  }, [isAddAsk]);

  return (
    <>
      {isAddAsk && (
        <div className="modal">
          <div className="modal__cnt">
            {/* for skip button focus */}
            <button className="modal__cn__hidden"></button>
            <div className="modal__cn">
              <button type="button" className="modal__cn__closebtn" onClick={onClose}>
                <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
              </button>
              <div className="model">
                <form ref={formRef} noValidate onSubmit={onFormSubmitHandler} className="addaskcnt">
                  <div className="addaskcnt__hdr">
                    {/* Form title */}
                    <h2 className="addaskcnt__hdr__ttl">Your Asks</h2>
                    {/* Count */}
                    <div className="addaskcnt__remng">{`(${remainingAsks}${remainingAsks > 1 ? '/3 asks' : '/3 asks'} remaining)`}</div>
                  </div>

                  <div ref={bodyRef} id="addaskform" className="addaskcnt__body">
                    {/* Title */}
                    <div className="addaskcnt__ttlsec">
                      <TextField
                        isError={title.trim().length === 0}
                        onChange={onTitleChangeHandler}
                        maxLength={32}
                        isMandatory={true}
                        id="add-ask-title"
                        label="Title*"
                        value={title}
                        defaultValue={title}
                        name="title"
                        type="text"
                        placeholder="Enter short title eg. Looking for partnerships"
                      />
                      <div className="addaskcnt__ttlsec__error">
                        <div>{errors.includes('Title') && <span className="error">Please enter title</span>}</div>
                        <div className="addaskcnt__ttlsec__cnt">{`${32 - title.length}/32`}</div>
                      </div>
                    </div>
                    {/* Description */}
                    <div className="addaskcnt__desc">
                      <label className="addaskcnt__desc__lbl">Describe what you need help with*</label>
                      <div className="addaskcnt__desc__edtr">
                        <TextEditor
                          maxLength={200}
                          height={165}
                          isRequired={description.trim().length ? false : true}
                          statusBar={false}
                          toolbarOptions="bold italic underline strikethrough customLinkButton"
                          text={description}
                          setContent={onEditorChange}
                          errorMessage={errors.includes('Description') ? 'Please enter description' : ''}
                          isToolbarSticky={false}
                        />
                        <HiddenField value={description.trim()} defaultValue={description} name={`description`} />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="addaskcnt__tagscnt">
                      <div className="addaskcnt__tagscnt__inpt">
                        <label className="addaskcnt__tagscnt__lbl">Select Tags*</label>
                        <div style={{ position: 'relative' }}>
                          <div className="addaskcnt__tagscnt__tagsandinput" onClick={onTagSectionClickHandler}>
                            {tags.length > 0 && (
                              <div className="addaskcnt__tagscnt__tagsandinput__tgs">
                                {tags?.map((tag: string, index: number) => (
                                  <div className="addaskcnt__tagscnt__tagsandinput__tgs__tag" key={`${tag}+${index}`}>
                                    {tag}
                                    <button onClick={() => onTagRemoveClickhandler(tag)} className="addaskcnt__tagscnt__tagsandinput__tgs__tag__dlte">
                                      <img alt="delete" src="/icons/close-gray.svg" />
                                    </button>
                                    <HiddenField value={tag ?? ''} defaultValue={tag ?? ''} name={`askTag${index}-name`} />
                                  </div>
                                ))}
                              </div>
                            )}
                            <input
                              onKeyDown={onTagsKeyDown}
                              ref={tagSearchRef}
                              onChange={onTagsChangeHandler}
                              className="addaskcnt__tagscnt__tagsandinput__input"
                              placeholder={`${(tags?.length === 0) ? "Select tags" : ""}`}
                              type="text"
                            />
                          </div>
                          {errors.includes('Tags') && <span className="error">Please select tag</span>}
                          {isTagsDropdown && (
                            <div className="addaskcnt__tagscnt__tagsandinput__optns">
                              {filteredTags?.length === 0 && <div className="addaskcnt__tagscnt__tagsandinput__optns__empty">No tags found</div>}
                              {filteredTags.map((tag: string, index: number) => (
                                <button onClick={() => onTagClicHandler(tag)} className="addaskcnt__tagscnt__tagsandinput__optns__optn" key={`${tag}+${index}`}>
                                  {tag}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="addaskcnt__fotr">
                    <div className="addaskcnt__fotr__ltoptns">
                      {type == 'Edit' && (
                        <>
                          <button type="button" onClick={() => onDeleteClickHandler(askId)} className="addaskcnt__fotr__ltoptns__dlt">
                            <span className="addaskcnt__fotr__ltoptns__dlt__txt">Delete</span>
                            <img className="addaskcnt__fotr__ltoptns__dlt__img" src="/icons/delete.svg"></img>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="addaskcnt__fotr__rtoptns">
                      <button type="button" className="addaskcnt__fotr__cncl" onClick={onClose}>
                        Cancel
                      </button>

                      <button type="button" onClick={onFormSubmit} className="addaskcnt__fotr__sbt">
                        {type === 'Add' && 'Submit'}
                        {type === 'Edit' && 'Update'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>
        {`
          button {
            background: inherit;
          }

          .modal {
            position: fixed;
            top: 0;
            right: 0;
            left: 0;
            bottom: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #00000066;
          }

          .modal__cn__closebtn {
            position: absolute;
            border: none;
            top: 12px;
            right: 12px;
            background: transparent;
            user-select: none;
            outline: none;
          }

          .modal__cnt {
            background: white;
            border-radius: 12px;
            position: relative;
          }

          .error {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            color: red;
          }
          .addaskcnt {
            width: 327px;
            max-height: 85vh;
            overflow: auto;
            display: flex;
            flex-direction: column;
          }

          .addaskcnt__hdr {
            min-height: 82px;
            height: 82px;
            flex: 1;
            padding: 0 24px;
          }
          .addaskcnt__hdr__ttl {
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
          }

          .addaskcnt__body {
            flex: 1;
            overflow: auto;
            padding: 0px 24px 24px 24px;
          }

          .addaskcnt__remng {
            color: #64748b;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
            margin: 18px 0;
          }

          .addaskcnt__desc {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 10px;
          }

          .addaskcnt__desc__edtr {
            min-height: 165px;
            position: unset;
          }

          .addaskcnt__tagscnt {
            display: flex;
            flex-direction: column;
            margin-top: 10px;
          }

          .addaskcnt__desc__lbl,
          .addaskcnt__tagscnt__lbl {
            font-weight: 600;
            font-size: 14px;
          }

          .addaskcnt__ttlsec {
            display: flex;
            flex-direction: column;
          }

          .addaskcnt__ttlsec {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .addaskcnt__ttlsec__cnt {
            color: #64748b;
            font-size: 12px;
            line-height: 20px;
            font-weight: 500;
            align-items: end;
            display: flex;
          }

          .addaskcnt__tagscnt__tagsandinput {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            min-height: 40px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 8px;
            align-items: center;
            flex-wrap: wrap;
            border: ${tags?.length > 0 ? '' : '1px solid red'};
          }

          .addaskcnt__tagscnt__inpt {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .addaskcnt__ttlsec__error {
            display: flex;
            justify-content: space-between;
          }

          .addaskcnt__tagscnt__tagsandinput__tgs {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .addaskcnt__tagscnt__tagsandinput__input {
            outline: none;
            border: none;
            flex: 1;
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
          }

          .addaskcnt__fotr {
            padding: 24px 24px 24px 24px;
            height: 62px;
            display: flex;
            gap: 10px;
            justify-content: space-between;
            align-items: center;
          }

          .addaskcnt__fotr__rtoptns {
            display: flex;
            gap: 10px;
          }

          .addaskcnt__fotr__ltoptns__dlt__web {
          }

          .addaskcnt__fotr__cncl {
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            background: inherit;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          .addaskcnt__fotr__ltoptns__dlt {
            background: inherit;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            box-shadow: 0px 1px 1px 0px #0f172a14;
          }

          .addaskcnt__fotr__sbt {
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            color: #ffff;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            background: #156ff7;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          .addaskcnt__tagscnt__tagsandinput__optns {
            position: absolute;
            top: 100%;
            height: 150px;
            overflow: auto;
            box-shadow: 0px 2px 6px 0px #0f172a29;
            boder-radius: 8px;
            padding: 8px;
            width: 100%;
            margin: 10px 0px;
            left: 0;
            padding-bottom: 20px;
            display: flex;
            flex-direction: column;
          }

          .addaskcnt__tagscnt__tagsandinput__optns__empty {
            text-align: center;
            width: 100%;
            font-size: 14px;
            line-height: 20px;
            font-weight: 400;
          }

          .addaskcnt__tagscnt__tagsandinput__optns__optn {
            padding: 8px 12px;
            font-size: 14px;
            line-height: 20px;
            font-weight: 400;
            background: inherit;
            text-align: left;
          }

          .addaskcnt__tagscnt__tagsandinput__optns__optn:hover {
            background-color: #f1f5f9;
            border-radius: 8px;
          }

          .addaskcnt__tagscnt__tagsandinput__tgs__tag {
            padding: 6px 12px;
            display: flex;
            align-items: center;
            gap: 4px;
            border: 1px solid #cbd5e1;
            border-radius: 24px;
            font-size: 12px;
            font-weight: 500;
            line-height: 14px;
            color: #0f172a;
            width: fit-content;
          }

          .addaskcnt__tagscnt__tagsandinput__tgs__tag__dlte {
            height: 16px;
          }

          .addaskcnt__fotr__ltoptns__dlt__txt {
            display: none;
          }

          @media (min-width: 1024px) {
            .addaskcnt {
              width: 656px;
            }

            .addaskcnt__fotr__ltoptns__dlt__txt {
              display: unset;
            }

            .addaskcnt__fotr__ltoptns__dlt__img {
              display: none;
            }

            .addaskcnt__fotr__ltoptns__dlt {
            }
          }
        `}
      </style>
    </>
  );
};

export default AddEditAsk;
