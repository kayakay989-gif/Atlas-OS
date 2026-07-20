'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@atlas/ui'
import { bookMeetingPublicAction, type MeetingActionState } from '@/app/actions/meetings'

interface PublicBookingFormProps {
  token: string
  slots: string[]
  defaultName?: string
}

const initialState: MeetingActionState = {}

export function PublicBookingForm({ token, slots, defaultName }: PublicBookingFormProps) {
  const [state, formAction, pending] = useActionState(bookMeetingPublicAction, initialState)

  if (state.success) {
    return (
      <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
        <p className="font-medium text-green-800">{state.success}</p>
        <p className="text-green-700">You can close this page.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}

      <div className="space-y-2">
        <Label htmlFor="attendeeName">Your name</Label>
        <Input id="attendeeName" name="attendeeName" required defaultValue={defaultName ?? ''} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="attendeeEmail">Your email</Label>
        <Input id="attendeeEmail" name="attendeeEmail" type="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduledStart">Select a time</Label>
        <select
          id="scheduledStart"
          name="scheduledStart"
          required
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Choose a slot</option>
          {slots.map((slot) => (
            <option key={slot} value={slot}>
              {new Date(slot).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'UTC',
              })}{' '}
              UTC
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={pending || slots.length === 0}>
        {pending ? 'Booking…' : 'Confirm meeting'}
      </Button>
    </form>
  )
}
