export {
  createProposalDraft,
  regenerateProposalContent,
  updateProposalContent,
  reviewProposal,
  sendProposal,
  generateInvoiceFromProposal,
  sendInvoice,
  markInvoicePaidAndTriggerOnboarding,
  completeOnboarding,
} from './pipeline'
export {
  generateProposalContent,
  generateInvoiceNumber,
  PROMPT_VERSION,
} from './services/proposal-generation-service'
