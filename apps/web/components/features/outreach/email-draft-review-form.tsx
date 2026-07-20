'use client'

import { useActionState } from 'react'
import { Button, Input, Label, Textarea } from '@atlas/ui'
import type { OutreachActionState } from '@/app/actions/outreach'
import type { QualityIssue } from '@atlas/types'

const initialState: OutreachActionState = {}

interface EmailDraftReviewFormProps {
  draftId: string
  subject: string
  body: string
  status: string
  qualityIssues: QualityIssue[]
  action: (prev: OutreachActionState, formData: FormData) => Promise<OutreachActionState>
  approveAction: () => Promise<void>
  rejectAction: () => Promise<void>
}

export function EmailDraftReviewForm({
  draftId,
  subject,
  body,
  status,
  qualityIssues,
  action,
  approveAction,
  rejectAction,
}: EmailDraftReviewFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const canReview = status === 'pending_review' || status === 'draft'

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="draftId" value={draftId} />
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            name="subject"
            defaultValue={subject}
            required
            disabled={!canReview}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Body</Label>
          <Textarea
            id="body"
            name="body"
            rows={12}
            defaultValue={body}
            required
            disabled={!canReview}
          />
        </div>
        {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
        {canReview ? (
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        ) : null}
      </form>

      {qualityIssues.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Quality checks</p>
          <ul className="space-y-1 text-sm">
            {qualityIssues.map((issue) => (
              <li
                key={`${issue.code}-${issue.message}`}
                className={
                  issue.severity === 'error' ? 'text-destructive' : 'text-muted-foreground'
                }
              >
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canReview ? (
        <div className="flex gap-2">
          <form action={approveAction}>
            <Button type="submit">Approve</Button>
          </form>
          <form action={rejectAction}>
            <Button type="submit" variant="outline">
              Reject
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
