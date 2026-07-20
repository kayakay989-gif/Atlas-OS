'use client'

import { useTransition } from 'react'
import { Button } from '@atlas/ui'
import {
  generateInvoiceAction,
  reviewProposalAction,
  sendProposalAction,
} from '@/app/actions/conversion'

interface ProposalActionsProps {
  proposalId: string
  status: string
}

export function ProposalActions({ proposalId, status }: ProposalActionsProps) {
  const [pending, startTransition] = useTransition()

  function run(action: (id: string) => Promise<{ error?: string; success?: string }>) {
    startTransition(async () => {
      await action(proposalId)
      window.location.reload()
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'pending_review' ? (
        <>
          <Button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await reviewProposalAction(proposalId, 'approved')
                window.location.reload()
              })
            }}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await reviewProposalAction(proposalId, 'rejected')
                window.location.reload()
              })
            }}
          >
            Reject
          </Button>
        </>
      ) : null}
      {status === 'approved' ? (
        <Button
          disabled={pending}
          onClick={() => {
            run(sendProposalAction)
          }}
        >
          Send proposal
        </Button>
      ) : null}
      {status === 'sent' || status === 'approved' ? (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            run(generateInvoiceAction)
          }}
        >
          Generate invoice
        </Button>
      ) : null}
    </div>
  )
}
