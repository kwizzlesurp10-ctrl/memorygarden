import { z } from 'zod'

export const ReflectionSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  taskId: z.string(),
  agentName: z.string(),
  whatWorked: z.string().min(10),
  whatCouldImprove: z.string().min(10),
  proposedPromptUpdate: z.string().optional(),
  proposedSkillUpdate: z.string().optional(),
  confidence: z.number().min(0).max(1),
})

export const TaskLogSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  agentName: z.string(),
  taskDescription: z.string(),
  inputSummary: z.string().optional(),
  success: z.boolean(),
  durationMs: z.number(),
  reflectionId: z.string().optional(),
})

export const SkillUpdateSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  agentName: z.string(),
  previousVersion: z.string(),
  newVersion: z.string(),
  reason: z.string(),
  triggeredByReflectionId: z.string().optional(),
})

export const AgentMemorySchema = z.object({
  agentName: z.string(),
  version: z.string().default('1.0.0'),
  lastUpdated: z.string(),
  totalTasksCompleted: z.number().default(0),
  totalReflections: z.number().default(0),
  taskHistory: z.array(TaskLogSchema).default([]),
  reflections: z.array(ReflectionSchema).default([]),
  skillUpdates: z.array(SkillUpdateSchema).default([]),
  customState: z.record(z.any()).default({}),
})

export type AgentMemory = z.infer<typeof AgentMemorySchema>
export type Reflection = z.infer<typeof ReflectionSchema>
export type TaskLog = z.infer<typeof TaskLogSchema>
export type SkillUpdate = z.infer<typeof SkillUpdateSchema>
