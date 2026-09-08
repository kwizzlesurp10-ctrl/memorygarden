import { z } from 'zod'
import { err, ok, type Result } from './result'

export const llmKindSchema = z.enum(['classify', 'reflect'])

export const llmRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  kind: llmKindSchema.optional().default('reflect'),
  jsonMode: z.boolean().optional().default(false),
  model: z.string().max(80).optional(),
})

export type LlmKind = z.infer<typeof llmKindSchema>
export type LlmRequest = z.infer<typeof llmRequestSchema>

export type LlmRequestError = {
  status: 400
  message: string
}

export function parseLlmRequest(raw: unknown): Result<LlmRequest, LlmRequestError> {
  const parsed = llmRequestSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return err({
      status: 400,
      message: first?.message ?? 'Invalid LLM request',
    })
  }
  return ok(parsed.data)
}

export function kindFromLegacyModel(model: string | undefined, kind: LlmKind): LlmKind {
  if (model === 'gpt-4o-mini' || model === 'haiku') return 'classify'
  return kind
}

export function gatewayModelForKind(kind: LlmKind): string {
  return kind === 'classify'
    ? 'anthropic/claude-haiku-4.5'
    : 'anthropic/claude-sonnet-4.6'
}

export function anthropicModelForKind(kind: LlmKind): string {
  return kind === 'classify' ? 'claude-haiku-4-5' : 'claude-sonnet-4-6'
}

export function usesAiGateway(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.AI_GATEWAY_API_KEY || (env.VERCEL === '1' && env.VERCEL_OIDC_TOKEN))
}

export function maxTokensForKind(kind: LlmKind): number {
  return kind === 'classify' ? 32 : 256
}

export function systemPromptFor(jsonMode: boolean): string {
  return jsonMode
    ? 'Reply with a single JSON value and no surrounding prose.'
    : 'You are a thoughtful writing companion for a personal memory garden. Be warm, contemplative, and brief.'
}
