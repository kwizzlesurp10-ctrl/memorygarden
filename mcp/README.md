# Memory Garden local MCP

Stdio MCP server for Cursor. Tools operate on garden **text metadata** (never photos).

## Tools

| Tool | Purpose |
| --- | --- |
| `list_memories` | List planted memories |
| `search_memories` | Ranked search over text / location / reflections |
| `get_memory` | Fetch one memory by id |
| `plant_memory` | Plant a text-only seed into a writable store |

## Data sources

Set one of:

- `MEMORYGARDEN_SNAPSHOT_PATH` — JSON file of `Memory[]` (or `{ memories: Memory[] }`). Writable.
- `MEMORYGARDEN_PAIR_CODE` — live pair room. Optional `MEMORYGARDEN_API_BASE` (default `http://localhost:5173`) and `MEMORYGARDEN_USER_ID`.

## Cursor

`.cursor/mcp.json` (gitignored if you prefer local-only):

```json
{
  "mcpServers": {
    "memory-garden": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "env": {
        "MEMORYGARDEN_SNAPSHOT_PATH": "./garden-snapshot.json"
      }
    }
  }
}
```

Run from the repo root: `npm run mcp`.
