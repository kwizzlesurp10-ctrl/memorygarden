/**
 * LLM client that replaces window.spark.llm().
 * Calls the /api/llm Vercel serverless function when available,
 * otherwise returns graceful fallback responses.
 */

interface LLMResponse {
  result: string
}

export async function llm(prompt: string, model: string = 'gpt-4o', jsonMode: boolean = false): Promise<string> {
  try {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model, jsonMode }),
    })

    if (!response.ok) {
      throw new Error(`LLM API returned ${response.status}`)
    }

    const data: LLMResponse = await response.json()
    return data.result
  } catch {
    // API not available — use fallback
    return getFallbackResponse(prompt, jsonMode)
  }
}

function getFallbackResponse(prompt: string, jsonMode: boolean): string {
  // For emotional tone classification
  if (prompt.includes('emotional tone') && prompt.includes('classify')) {
    const text = prompt.toLowerCase()
    if (text.includes('joy') || text.includes('happy') || text.includes('laugh') || text.includes('celebration')) {
      return 'happy'
    }
    if (text.includes('miss') || text.includes('remember') || text.includes('long ago')) {
      return 'nostalgic'
    }
    if (text.includes('think') || text.includes('wonder') || text.includes('learn')) {
      return 'reflective'
    }
    if (text.includes('bitter') || text.includes('sad') || text.includes('loss') || text.includes('goodbye')) {
      return 'bittersweet'
    }
    return 'peaceful'
  }

  // For AI reflection generation
  if (prompt.includes('gentle, poetic garden guide') || prompt.includes('reflection')) {
    return 'This memory holds a special place in your garden. Each time you revisit it, new layers of meaning unfold — like petals opening to the morning sun.'
  }

  // For cluster analysis (JSON mode)
  if (jsonMode) {
    return JSON.stringify({
      clusters: [
        {
          name: 'Your Memories',
          description: 'All memories in your garden',
          memoryIds: [],
          theme: 'peaceful',
        },
      ],
    })
  }

  return 'This is a beautiful memory worth nurturing.'
}
