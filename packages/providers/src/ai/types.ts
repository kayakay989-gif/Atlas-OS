import type { Provider } from '../types'

/** AI model providers (OpenAI, Anthropic, Gemini, etc.). */
export interface AiProvider extends Provider {
  complete(input: AiCompletionInput): Promise<AiCompletionResult>
}

export interface AiCompletionInput {
  prompt: string
  model?: string
}

export interface AiCompletionResult {
  text: string
  model: string
}
