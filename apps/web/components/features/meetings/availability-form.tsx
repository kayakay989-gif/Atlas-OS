'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@atlas/ui'
import { updateAvailabilityAction, type MeetingActionState } from '@/app/actions/meetings'

interface AvailabilityFormProps {
  timezone: string
  slotDurationMinutes: number
  minNoticeHours: number
}

const initialState: MeetingActionState = {}

export function AvailabilityForm({
  timezone,
  slotDurationMinutes,
  minNoticeHours,
}: AvailabilityFormProps) {
  const [state, formAction, pending] = useActionState(updateAvailabilityAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" name="timezone" defaultValue={timezone} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slotDurationMinutes">Slot duration (minutes)</Label>
          <Input
            id="slotDurationMinutes"
            name="slotDurationMinutes"
            type="number"
            min={15}
            max={120}
            defaultValue={slotDurationMinutes}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minNoticeHours">Minimum notice (hours)</Label>
          <Input
            id="minNoticeHours"
            name="minNoticeHours"
            type="number"
            min={0}
            defaultValue={minNoticeHours}
          />
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        Default availability: Monday–Friday, 09:00–17:00 UTC.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save availability'}
      </Button>
    </form>
  )
}
