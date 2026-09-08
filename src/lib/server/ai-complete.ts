import { generateText } from 'ai'
import {
  gatewayModelForKind,
  maxTokensForKind,
  systemPromptFor,
  type LlmRequest,
} from '../llm-request'

export async function completeWithAiSdk(request: LlmRequest): Promise<string> {
  const result = await generateText({
    model: gatewayModelForKind(request.kind),
    system: systemPromptFor(request.jsonMode),
    prompt: request.prompt,
    maxOutputTokens: maxTokensForKind(request.kind),
  })
  return result.text.trim()
}
