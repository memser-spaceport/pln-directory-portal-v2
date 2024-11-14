import { SyntheticEvent } from 'react';

interface TagProps {
  disabled?: boolean;
  callback?: (key: string, value: string, selected: boolean, from?: string) => void;
  selected?: boolean;
  value: string;
  variant?: string;
  tagsLength?: number;
  keyValue?: string;
  from?: string;
}

export function Tag(props: Readonly<TagProps>) {
  // Props
  const selected = props.selected ?? false;
  const disabled = props.disabled ?? false;
  const value = props.value ?? '';
  const callback = props?.callback;
  const variant = props?.variant ?? 'tag-default';
  const tagsLength = props?.tagsLength ?? 3;
  const keyValue = props?.keyValue ?? '';
  const from = props?.from ?? '';

  const getTagStyle = () => {
    if (variant === 'secondary') {
      if (selected) {
        return 'tag tag--active';
      }
      if (disabled) {
        return 'tag tag--inactive';
      }
      return 'tag-secondary';
    } else if (variant === 'primary') {
      return 'tag-primary';
    }
    return 'tag-default';
  };

  const onTagClickHandler = (event: SyntheticEvent) => {
    if (callback) {
      callback(keyValue, value, selected, from);
      return;
    }
    event.preventDefault();
  };

  return (
    <>
      <button tabIndex={-1} data-testid={`ui-tag-${value}`} className={`tag ${getTagStyle()}  ${tagsLength < 3 ? 'tag-md' : ''}`} onClick={onTagClickHandler} disabled={disabled}>
        {value}
      </button>
      <style jsx>
        {`
          button {
            outline: none;
            background-color: inherit;
            border: none;
          }
          .tag {
            display: flex;
            padding: 6px 10px;
            align-items: flex-start;
            border-radius: 24px;
            font-size: 12px;
            font-weight: 500;
            line-height: 14px;
            background: #fff;
          }
          .tag-secondary {
            border: 1px solid #cbd5e1;
            font-weight: 500;
            white-space: wrap;
            text-align: left;
            color: #0f172a;
          }

          .tag-default {
            border: none;
            border-radius: 24px;
            color: #475569;
            font-size: 12px;
            font-weight: 500;
            line-height: 14px;
            background-color: #f1f5f9;
            cursor: default;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: inline-block;
            max-width: 80px;
          }

          .tag-primary {
            align-items: flex-start;
            background: #f1f5f9;
            border: none;
            max-width: 66px;
            white-space: nowrap;
            border: 1px solid #f1f5f9;
            overflow: hidden;
            text-overflow: ellipsis;
            display: inline-block;
            cursor: default;
            color: #475569;
          }

          .tag-md {
            max-width: 100px;
          }

          .tag--active {
            border: 1px solid rgb(29 78 216);
            color: rgb(29 78 216);
            text-align: left;
            background-color: rgb(219 234 254);
          }

          .tag-secondary:focus {
            box-shadow: 0 0 0 2px rgba(21, 111, 247, 0.25);
          }

          .tag:focus-visible {
          }
          .tag:focus-within {
            border-radius: 24px;
          }

          .tag-secondary:hover {
            border: 1px solid rgb(148 163 184);
          }

          .tag--inactive {
            pointer-events: none;
            border: 1px solid #cbd5e1;
            background-color: rgb(248 250 252);
            color: rgb(100 116 139);
            text-align: left;
          }

          @media (min-width: 1024px) {
            .tag-default {
              max-width: 150px;
            }

            .tag-primary {
              max-width: 60px;
            }

            .tag-md {
              max-width: 120px;
            }
          }
        `}
      </style>
    </>
  );
}
