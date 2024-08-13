'use client'
function HuskyHelper() {
    const onOpenChat = () => {
        document.dispatchEvent(new CustomEvent('open-husky-dialog'))
    }
    const onOpenDiscover = () => {
        document.dispatchEvent(new CustomEvent('open-husky-discover'))
    }
    return <>
     <button onClick={onOpenChat}>Open Chat</button>
     <button onClick={onOpenDiscover}>Open Discover</button>
    </>
}

export default HuskyHelper