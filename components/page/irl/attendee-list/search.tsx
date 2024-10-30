const Search = (props: any) => {
  const onChange = props?.onChange;
  const placeholder = props?.placeholder;
  const searchRef = props?.searchRef

  return (
    <>
      <div className="search">
        <input ref={searchRef} onChange={onChange} className="search__input" placeholder={placeholder} />
        <button className="search__btn">
          <img src="/icons/search.svg" alt="search" width={16} height={16} />
        </button>
      </div>
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
