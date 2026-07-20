'use client'

import '@atlas/ui/styles/globals.css'
import { useEffect } from 'react'
import { Button } from '@atlas/ui'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(JSON.stringify({ level: 'error', message: error.message, digest: error.digest }))
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">An unexpected error occurred.</p>
        <Button onClick={reset}>Try again</Button>
      </body>
    </html>
  )
}
