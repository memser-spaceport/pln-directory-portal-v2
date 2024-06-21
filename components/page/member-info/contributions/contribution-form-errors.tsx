function ContributionFormErrors(props) {
    const errors = props.errors ?? [];
    const index = props.index ?? ''
    return <>
      
      <style jsx>
        {

            `
            .error {color: #ef4444; font-size: 12px;}
            
            `
        }
      </style>

    </>
}

export default ContributionFormErrors