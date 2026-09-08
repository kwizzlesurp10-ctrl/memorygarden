import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import {
  anthropicModelForKind,
  gatewayModelForKind,
  maxTokensForKind,
  systemPromptFor,
  usesAiGateway,
  type LlmRequest,
} from '../llm-request'

export async function completeWithAiSdk(request: LlmRequest): Promise<string> {
  const model = usesAiGateway()
    ? gatewayModelForKind(request.kind)
    : createAnthropic()(anthropicModelForKind(request.kind))

  const result = await generateText({
    model,
    system: systemPromptFor(request.jsonMode),
    prompt: request.prompt,
    maxOutputTokens: maxTokensForKind(request.kind),
  })
  return result.text.trim()
}
