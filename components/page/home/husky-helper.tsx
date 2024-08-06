'use client'
function HuskyHelper() {
    const onOpen = () => {
        document.dispatchEvent(new CustomEvent('open-husky-dialog'))
    }
    return <>
     <button onClick={onOpen}>Open Dialog</button>
    </>
}

export default HuskyHelper