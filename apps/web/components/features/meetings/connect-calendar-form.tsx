'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@atlas/ui'
import { connectCalendarAction, type MeetingActionState } from '@/app/actions/meetings'

const initialState: MeetingActionState = {}

export function ConnectCalendarForm() {
  const [state, formAction, pending] = useActionState(connectCalendarAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="externalAccountEmail">Google Calendar email</Label>
        <Input
          id="externalAccountEmail"
          name="externalAccountEmail"
          type="email"
          required
          placeholder="you@company.com"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Connecting…' : 'Connect calendar'}
      </Button>
    </form>
  )
}
