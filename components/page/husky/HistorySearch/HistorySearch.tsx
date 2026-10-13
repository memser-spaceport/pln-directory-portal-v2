import { CloseIcon, SearchIcon } from '@/components/icons';

import s from './HistorySearch.module.scss';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const HistorySearch = (props: Props) => {
  const { value, onChange } = props;

  return (
    <label className={s.root}>
      <SearchIcon width={14} height={14} className={s.icon} aria-hidden="true" />
      <input
        className={s.input}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search chats"
        aria-label="Search chats"
      />
      {value && (
        <button type="button" className={s.clear} onClick={() => onChange('')} aria-label="Clear search">
          <CloseIcon width={12} height={12} />
        </button>
      )}
    </label>
  );
};
