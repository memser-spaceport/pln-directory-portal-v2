const AttendeeFormErrors = (props: any) => {
  const errors = props?.errors ?? [];
  const participationErrors = errors?.participationErrors.length > 0 ? ['Please enter a valid URL'] : [];

  const allErrors = [...errors?.gatheringErrors, ...participationErrors, ...errors?.dateErrors];

  return (
    <>
      {allErrors?.length > 0 && (
        <ul className="errcnt">
          {allErrors.map((error: any, index: number) => {
            return (
              <li className="errcnt__error" key={index}>
                {error}
              </li>
            );
          })}
        </ul>
      )}

      <style jsx>
        {`
          .errcnt {
            display: flex;
            padding: 0 20px 0 20px;
            flex-direction: column;
          }

          .errcnt__error {
            line-height: 24px;
            font-weight: 600;
            color: #dc2625;
            font-size: 14px;
          }
        `}
      </style>
    </>
  );
};

export default AttendeeFormErrors;
