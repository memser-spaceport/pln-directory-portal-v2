



const AttendeeFormErrors = (props: any) => {
    const errors = props?.errors ?? [];
    const participationErrors = errors?.participationError.length > 0 ? ["Host/Speaker details has to be entered"] : [];

    const allErrors = [...errors?.gatheringsError, ...participationErrors, ...errors?.dateErrors];

    return <>
        <ul className="errcnt">
            {allErrors.map((error: any, index: number) => {
                return <li className="errcnt__error" key={index}>{error}</li>
            })}
        </ul>

        <style jsx>
            {
                `
                .errcnt {
                display: flex;
                padding: 0 20px 0 20px;
                flex-direction: column;

                }

                .errcnt__error {
                line-height: 24px;
                font-weight: 600;
                color: #DC2625;
                font-size: 14px;}
                
                `
            }
        </style>
        </>
}

export default AttendeeFormErrors;

