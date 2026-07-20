'use client'

import { useTransition } from 'react'
import { Button } from '@atlas/ui'
import {
  completeOnboardingAction,
  markInvoicePaidAction,
  sendInvoiceAction,
} from '@/app/actions/conversion'

interface InvoiceActionsProps {
  invoiceId: string
  status: string
  onboardingId?: string | null
  onboardingStatus?: string | null
}

export function InvoiceActions({
  invoiceId,
  status,
  onboardingId,
  onboardingStatus,
}: InvoiceActionsProps) {
  const [pending, startTransition] = useTransition()

  function run(action: (id: string) => Promise<{ error?: string; success?: string }>) {
    startTransition(async () => {
      await action(invoiceId)
      window.location.reload()
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'draft' ? (
        <Button
          disabled={pending}
          onClick={() => {
            run(sendInvoiceAction)
          }}
        >
          Send invoice
        </Button>
      ) : null}
      {status === 'sent' || status === 'draft' ? (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            run(markInvoicePaidAction)
          }}
        >
          Mark paid & start onboarding
        </Button>
      ) : null}
      {status === 'paid' && onboardingId && onboardingStatus !== 'completed' ? (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await completeOnboardingAction(onboardingId)
              window.location.reload()
            })
          }}
        >
          Complete onboarding
        </Button>
      ) : null}
    </div>
  )
}
