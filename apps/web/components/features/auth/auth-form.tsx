'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@atlas/ui'
import type { AuthActionState } from '@/app/actions/auth'

interface AuthFormProps {
  action: (prev: AuthActionState, formData: FormData) => Promise<AuthActionState>
  submitLabel: string
  fields: {
    name: string
    label: string
    type?: string
    autoComplete?: string
    required?: boolean
  }[]
  hiddenFields?: Record<string, string>
}

const initialState: AuthActionState = {}

export function AuthForm({ action, submitLabel, fields, hiddenFields }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            name={field.name}
            type={field.type ?? 'text'}
            autoComplete={field.autoComplete}
            required={field.required ?? true}
          />
        </div>
      ))}

      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-muted-foreground text-sm">{state.success}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Please wait…' : submitLabel}
      </Button>
    </form>
  )
}
