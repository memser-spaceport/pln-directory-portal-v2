'use client'

import { triggerLoader } from "@/utils/common.utils"
import { useEffect } from "react"

export default function MemberDetails() {
    useEffect(() => {
        triggerLoader(false);
    }, [])
    return <></>
   }