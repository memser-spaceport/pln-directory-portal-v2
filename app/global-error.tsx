'use client'

import Error from "@/components/core/error"

 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Error/>
  )
}