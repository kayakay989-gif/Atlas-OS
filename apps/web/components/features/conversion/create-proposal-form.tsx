'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@atlas/ui'
import { createProposalAction, type ConversionActionState } from '@/app/actions/conversion'

interface CompanyOption {
  id: string
  name: string
}

interface CreateProposalFormProps {
  companies: CompanyOption[]
  defaultCompanyId?: string
  defaultMeetingId?: string
  defaultContactId?: string
  defaultAmountCents?: number
}

const initialState: ConversionActionState = {}

export function CreateProposalForm({
  companies,
  defaultCompanyId,
  defaultMeetingId,
  defaultContactId,
  defaultAmountCents = 500000,
}: CreateProposalFormProps) {
  const [state, formAction, pending] = useActionState(createProposalAction, initialState)

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      {defaultMeetingId ? <input type="hidden" name="meetingId" value={defaultMeetingId} /> : null}
      {defaultContactId ? <input type="hidden" name="contactId" value={defaultContactId} /> : null}

      <div className="space-y-2">
        <Label htmlFor="companyId">Company</Label>
        <select
          id="companyId"
          name="companyId"
          required
          defaultValue={defaultCompanyId ?? ''}
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select company
          </option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amountCents">Amount (cents)</Label>
        <Input
          id="amountCents"
          name="amountCents"
          type="number"
          min={0}
          defaultValue={defaultAmountCents}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Input id="currency" name="currency" defaultValue="USD" maxLength={3} required />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Generate proposal'}
      </Button>

      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm">
          {state.success}
          {state.proposalId ? (
            <>
              {' '}
              <a href={`/proposals/${state.proposalId}`} className="text-primary hover:underline">
                View proposal →
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </form>
  )
}
