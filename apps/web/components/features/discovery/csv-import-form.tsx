'use client'

import { useActionState } from 'react'
import { Button, Label, Textarea } from '@atlas/ui'
import type { DiscoveryActionState } from '@/app/actions/discovery'

const initialState: DiscoveryActionState = {}

interface CsvImportFormProps {
  icpProfileId: string
  action: (prev: DiscoveryActionState, formData: FormData) => Promise<DiscoveryActionState>
}

export function CsvImportForm({ icpProfileId, action }: CsvImportFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="icpProfileId" value={icpProfileId} />
      <div className="space-y-2">
        <Label htmlFor="csvContent">CSV content</Label>
        <Textarea
          id="csvContent"
          name="csvContent"
          rows={8}
          placeholder={`name,domain\nAcme Inc,acme.com\nBeta LLC,beta.io`}
          required
        />
        <p className="text-muted-foreground text-xs">
          Required column: name. Optional: domain, website_url. Research runs asynchronously after
          import.
        </p>
      </div>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Importing…' : 'Import & start research'}
      </Button>
    </form>
  )
}
