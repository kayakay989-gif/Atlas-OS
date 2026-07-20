import type { Provider } from '../types'

/** Email delivery providers (SMTP, SES, Resend, etc.). */
export interface EmailProvider extends Provider {
  send(message: OutboundEmail): Promise<EmailSendResult>
}

export interface OutboundEmail {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailSendResult {
  messageId: string
}
