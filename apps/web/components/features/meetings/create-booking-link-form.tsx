'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@atlas/ui'
import { createBookingLinkAction, type MeetingActionState } from '@/app/actions/meetings'

interface CreateBookingLinkFormProps {
  companies: { id: string; name: string }[]
}

const initialState: MeetingActionState = {}

export function CreateBookingLinkForm({ companies }: CreateBookingLinkFormProps) {
  const [state, formAction, pending] = useActionState(createBookingLinkAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
      {state.bookingUrl ? (
        <p className="bg-muted/40 rounded-md border p-3 text-sm">
          <span className="font-medium">Booking URL:</span>{' '}
          <code className="break-all">{state.bookingUrl}</code>
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="label">Link label</Label>
        <Input id="label" name="label" placeholder="Intro call" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyId">Company (optional)</Label>
        <select
          id="companyId"
          name="companyId"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Any lead</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create booking link'}
      </Button>
    </form>
  )
}
