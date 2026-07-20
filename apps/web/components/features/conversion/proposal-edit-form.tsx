'use client'

import { useActionState } from 'react'
import { Button, Input, Label, Textarea } from '@atlas/ui'
import { updateProposalAction, type ConversionActionState } from '@/app/actions/conversion'

interface ProposalEditFormProps {
  proposalId: string
  title: string
  content: string
  amountCents: number
  editable: boolean
}

const initialState: ConversionActionState = {}

export function ProposalEditForm({
  proposalId,
  title,
  content,
  amountCents,
  editable,
}: ProposalEditFormProps) {
  const [state, formAction, pending] = useActionState(updateProposalAction, initialState)

  if (!editable) {
    return (
      <pre className="bg-muted/30 overflow-x-auto whitespace-pre-wrap rounded-lg border p-4 text-sm">
        {content}
      </pre>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="proposalId" value={proposalId} />

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={title} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amountCents">Amount (cents)</Label>
        <Input
          id="amountCents"
          name="amountCents"
          type="number"
          min={0}
          defaultValue={amountCents}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" name="content" defaultValue={content} rows={16} required />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>

      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-muted-foreground text-sm">{state.success}</p> : null}
    </form>
  )
}
