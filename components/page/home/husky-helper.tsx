'use client'

import { getHuskyResponseBySlug } from "@/services/husky.service"

function HuskyHelper() {
    const onOpenChat = async () => {
        document.dispatchEvent(new CustomEvent('open-husky-dialog'))
    }
    const onOpenDiscover = async () => {
        const result =  await getHuskyResponseBySlug('4yfzhh')
        document.dispatchEvent(new CustomEvent('open-husky-discover', {detail: result.data}))
    }
    return <>
     <button onClick={onOpenChat}>Open Chat</button>
     <button onClick={onOpenDiscover}>Open Discover</button>
    </>
}

export default HuskyHelper