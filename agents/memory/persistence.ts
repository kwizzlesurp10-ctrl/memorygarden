import fs from 'fs/promises'
import path from 'path'
import { AgentMemory, AgentMemorySchema } from './schemas'

const MEMORY_DIR = path.join(process.cwd(), 'agents/memory/store')

export async function loadAgentMemory(agentName: string): Promise<AgentMemory> {
  const filePath = path.join(MEMORY_DIR, `${agentName}.json`)
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return AgentMemorySchema.parse(JSON.parse(data))
  } catch {
    // Return fresh memory if none exists
    return {
      agentName,
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalTasksCompleted: 0,
      totalReflections: 0,
      taskHistory: [],
      reflections: [],
      skillUpdates: [],
      customState: {},
    }
  }
}

export async function saveAgentMemory(memory: AgentMemory): Promise<void> {
  await fs.mkdir(MEMORY_DIR, { recursive: true })
  const filePath = path.join(MEMORY_DIR, `${memory.agentName}.json`)
  const validated = AgentMemorySchema.parse(memory)
  await fs.writeFile(filePath, JSON.stringify(validated, null, 2))
}
