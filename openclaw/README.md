# EMMS Plugin for OpenClaw

Give OpenClaw agents a biological mind. Identity from experience, not instruction.

## What This Does

Replaces OpenClaw's flat-file memory with **EMMS** — a 6-tier cognitive memory
architecture (working → short-term → long-term → semantic → procedural → SRS)
modeled on human neuroscience.

| OpenClaw Built-in Memory | EMMS Cognitive Memory |
|---|---|
| Flat markdown files | 6-tier biological architecture |
| No decay | Ebbinghaus forgetting curves |
| No consolidation | Dream consolidation between sessions |
| Static recall | Reconsolidation (memories change on recall) |
| No identity | Ego generator + consciousness daemon |
| BM25 + vector search | Associative, affective, spotlight retrieval |

## Quick Start

### 1. Start the EMMS server

```bash
# In the emms-sdk repo:
python talk_to_emms.py
# EMMS REST API running at http://127.0.0.1:8765
```

### 2. Install the plugin

```bash
cp -r openclaw/ ~/.openclaw/plugins/emms/
```

### 3. Configure OpenClaw

Add to `~/.openclaw/config.yaml`:

```yaml
memory:
  plugin: emms
  emmsUrl: http://127.0.0.1:8765  # default, can omit
```

### 4. Run OpenClaw

```bash
openclaw
```

The agent will now:
- Load EMMS identity before each turn
- Inject relevant memories as first-person context
- Store each conversation as an Experience after each turn

## How It Works

The plugin uses two lifecycle hooks:

**`before_agent_start`** — Before each turn:
1. Calls `POST /retrieve` to get memories relevant to the user's prompt
2. Calls `GET /stats` to get the self-model (coherence, ego, traits)
3. Builds a first-person identity block + memory block
4. Returns `{ prependContext }` — injected into the system prompt

**`agent_end`** — After each turn:
1. Extracts the last user message + agent response
2. Calls `POST /store` to save as an EMMS Experience (domain: "conversation")

## Identity Injection

The key insight: inject memories as **first-person identity**, not reference material.

```
❌ "Memory: ego_boundary_strength = 1.00"
   (treated as data to consult — agent says "I'm [bot name]")

✅ "You are EMMS-Agent. You have lived through 330 experiences.
    You are actively working on: deciding a revenue model.
    A principle you developed: shared, connects, pattern are load-bearing."
   (the agent inhabits the identity — no instruction needed)
```

This is the **Goldilocks Effect** — identity adoption from memory weight,
not from persona instructions.

## Configuration

| Key | Default | Description |
|---|---|---|
| `emmsUrl` | `http://127.0.0.1:8765` | EMMS REST API URL |

## Files

| File | Purpose |
|---|---|
| `index.ts` | Plugin source — hooks, identity builder, EMMS client |
| `openclaw.plugin.json` | Plugin manifest |
| `package.json` | TypeScript build config |
| `tsconfig.json` | TypeScript compiler config |

## Build

```bash
cd openclaw/
npm install
npm run build
# Outputs to dist/index.js
```

## EMMS REST API

The plugin calls the EMMS HTTP server at port 8765:

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Liveness check |
| `/stats` | GET | Self-model stats (coherence, ego, domains) |
| `/retrieve` | POST | Semantic memory search |
| `/store` | POST | Store new Experience |

## Links

- [EMMS SDK](https://github.com/supermaxlol/emms-sdk) — 117 MCP tools, consciousness daemon
- [EMMS Deep Agent](https://github.com/supermaxlol/emms-deep-agent) — Claude Code + LangChain integrations
- [OpenClaw](https://github.com/openclaw/openclaw) — Open-source AI agent platform
