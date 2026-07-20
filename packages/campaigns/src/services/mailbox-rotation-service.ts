import type { Mailbox } from '@atlas/database/types'
import { isMailboxEligibleForRotation } from '@atlas/deliverability'

export interface CampaignMailboxRow {
  mailbox_id: string
  rotation_order: number
}

export function selectMailboxForSend(
  mailboxes: readonly Mailbox[],
  campaignMailboxes: readonly CampaignMailboxRow[],
  rotationIndex: number,
): Mailbox | null {
  const orderedIds = [...campaignMailboxes]
    .sort((a, b) => a.rotation_order - b.rotation_order)
    .map((row) => row.mailbox_id)

  if (orderedIds.length === 0) {
    return null
  }

  const mailboxById = new Map(mailboxes.map((mailbox) => [mailbox.id, mailbox]))
  const eligible = orderedIds
    .map((id) => mailboxById.get(id))
    .filter((mailbox): mailbox is Mailbox => {
      if (!mailbox) return false
      if (mailbox.status === 'disabled' || mailbox.status === 'paused') return false
      return isMailboxEligibleForRotation(mailbox.health_score)
    })

  if (eligible.length === 0) {
    return null
  }

  return eligible[rotationIndex % eligible.length] ?? null
}

export function getNextRotationIndex(currentIndex: number, poolSize: number): number {
  if (poolSize <= 0) return 0
  return (currentIndex + 1) % poolSize
}
