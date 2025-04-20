/**
 * Props for the Search component.
 */
export interface SearchProps {
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  searchRef?: React.RefObject<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

/**
 * Search input component with a search button.
 *
 * @component
 * @param {SearchProps} props - The props for the Search component.
 * @returns {JSX.Element} The rendered search input and button.
 */
const Search = (props: SearchProps): JSX.Element => {
  // Destructure props for clarity
  const { onChange, placeholder, searchRef, onKeyDown } = props;

  return (
    <>
      {/* Search input and button container */}
      <div className="search">
        <input ref={searchRef} onChange={onChange} className="search__input" placeholder={placeholder} onKeyDown={onKeyDown} />
        <button type="button" className="search__btn">
          <img src="/icons/search.svg" alt="search" width={16} height={16} />
        </button>
      </div>
      {/* Component styles */}
      <style jsx>{`
        .search {
          width: 100%;
          background-color: #ffffff;
          display: flex;
          border-radius: 4px;
          border: 0.5px solid #156FF7;
          box-shadow: 0px 0px 4px 0px #0F172A33;
        }

        .search__input {
          width: 100%;
          padding: 8px 0px 8px 12px;
          border-radius: 4px 0px 0px 4px;
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          border:none;
        }

        .search__input:focus {
          outline: none;
        }

        .search__input::placeholder {
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          color: #94a3b8;
        }

        .search__btn {
          height: 40px;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: unset;
          background:transparent;
        }
      `}</style>
    </>
  );
};

export default Search;
