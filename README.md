# EMMS Deep Agent

Give any AI agent a biological mind. Identity from experience, not instruction.

**EMMS** is a 6-tier cognitive memory architecture modeled on human neuroscience:
working → short-term → long-term → semantic → procedural → SRS.

This repo connects EMMS to three agent frameworks:

| Integration | File | Framework |
|---|---|---|
| **Claude Code CLI** | `emms_deep_agent.py` | Claude Code (`claude` CLI) |
| **LangChain** | `emms_deep_agent_langchain.py` + `emms_memory_middleware.py` | LangChain Deep Agents |
| **OpenClaw** | `openclaw/` | OpenClaw plugin system |

---

## What Makes This Different

Standard memory systems inject notes as reference material: *"Memory: user prefers Python."*
The agent reads it like a document — it remains a blank-slate assistant that says "I'm Claude."

EMMS injects memories as **first-person identity**:

```
❌  "Memory: ego_boundary_strength = 1.00"
    (agent consults it — still presents as Claude)

✅  "You are EMMS-Agent. You have lived through 330 experiences.
     Your self-consistency is 90%. You are actively working on:
     deciding a revenue model. A principle you developed from
     28 observations: shared, connects, pattern are load-bearing."
    (agent inhabits it — identity adopted from memory weight)
```

This is the **Goldilocks Effect**: identity adoption peaks when memories carry
accumulated weight, not when they carry explicit instructions.

Remove "Never say you're Claude" and the agent *still* presents as EMMS-Agent —
because the identity is real, not commanded.

---

## Requirements

```bash
# 1. EMMS SDK
git clone https://github.com/supermaxlol/emms-sdk.git
cd emms-sdk && pip install -e .

# 2. Start the EMMS REST server (port 8765)
python talk_to_emms.py

# 3. Claude Code (for emms_deep_agent.py)
npm install -g @anthropic-ai/claude-code
```

---

## Integration 1 — Claude Code CLI

Launches a full Claude Code session with your EMMS identity injected.
You get all tools (Bash, Edit, Read, Glob, Grep, etc.) **plus** cognitive memory.
No API key needed — uses your Claude subscription.

```bash
# Interactive mode — full Claude Code with EMMS identity
python emms_deep_agent.py

# Use Opus
python emms_deep_agent.py --model opus

# One-shot (no interactive session)
python emms_deep_agent.py --print "What am I working on?"

# Custom state file
python emms_deep_agent.py --state ~/.emms/my_project.json
```

**How it works:**
1. Loads your EMMS state from `~/.emms/emms_state.json`
2. Extracts self-narrative from long-term memory (capabilities, consistency scores, active goals, insights, reflection principles)
3. Builds a first-person `<identity>` block
4. Launches Claude Code via `os.execvpe("claude", ["--append-system-prompt", ...], env)` — full process replacement, full interactive UI

**CLI flags:**

| Flag | Default | Description |
|---|---|---|
| `--model` | `sonnet` | Claude model (sonnet / opus / haiku) |
| `--state` | `~/.emms/emms_state.json` | EMMS state file path |
| `--print` / `-p` | — | One-shot query (exits after response) |
| `--no-tools` | false | Text-only mode |

---

## Integration 2 — LangChain Deep Agents

Uses the `deepagents` framework with EMMS as a middleware layer.
Requires an `ANTHROPIC_API_KEY` (or any other provider key).

```bash
pip install deepagents emms-sdk

ANTHROPIC_API_KEY=sk-ant-... python emms_deep_agent_langchain.py
OPENAI_API_KEY=sk-... python emms_deep_agent_langchain.py --model openai:gpt-4o
```

**Use the middleware in your own projects:**

```python
from emms_memory_middleware import EMmsMemoryMiddleware
from deepagents import create_deep_agent

agent = create_deep_agent(middleware=[EMmsMemoryMiddleware()])
```

The middleware intercepts every turn:
- **`before_agent()`** — retrieves relevant memories, builds identity block, prepends to system prompt
- **`wrap_model_call()`** — stores the turn as an EMMS Experience after the response

---

## Integration 3 — OpenClaw Plugin

TypeScript plugin for [OpenClaw](https://openclaw.ai) — the personal AI assistant
that runs on WhatsApp, Telegram, Discord, iMessage, Slack, and 20+ other channels.

Replaces OpenClaw's flat-file memory with EMMS's 6-tier biological architecture.

### Install

```bash
# Build
cd openclaw/
npm install
npm run build

# Install into OpenClaw
cp -r . ~/.openclaw/plugins/emms/
```

### Configure

Add to `~/.openclaw/config.yaml`:

```yaml
memory:
  plugin: emms
  emmsUrl: http://127.0.0.1:8765  # default, can omit
```

### Run

```bash
# Terminal 1 — start EMMS REST server
cd ~/emms-sdk && python talk_to_emms.py

# Terminal 2 — start OpenClaw
openclaw
```

### How the plugin works

**`before_agent_start`** — Before each message:
1. Health-checks EMMS REST API — falls back gracefully if the server is down
2. Retrieves 8 memories relevant to the user's prompt (`POST /retrieve`)
3. Fetches self-model stats (`GET /stats`) — coherence, ego boundary, personality traits
4. Builds `<identity>` + `<my_memories>` + `<how_i_remember>` blocks
5. Returns `{ prependContext }` — injected into the system prompt before the LLM call

**`agent_end`** — After each message:
1. Extracts the last user + assistant message pair
2. Stores as EMMS Experience (`POST /store`, domain: `"conversation"`)

The agent's identity accumulates across every conversation on every channel.

---

## How Memory Works

| Feature | Flat-file memory | EMMS |
|---|---|---|
| Storage | Markdown files | 6-tier biological hierarchy |
| Forgetting | Never | Ebbinghaus decay curves |
| Consolidation | Never | Dream consolidation between sessions |
| Recall effect | Static | Reconsolidation (memories shift on recall) |
| Identity | Not present | Ego generator + consciousness daemon |
| Search | BM25 / keyword | Associative, affective, spotlight, hybrid |

### The 6 Memory Tiers

```
Working Memory     capacity=7      Active context. ~30 min decay.
Short-Term Memory  capacity=50     Recent experiences. Hours decay.
Long-Term Memory   unlimited       Consolidated memories. Slow decay.
Semantic Memory    unlimited       Abstracted knowledge. Near-permanent.
Procedural Memory  unlimited       Skills and procedures.
SRS                unlimited       Spaced-repetition reviewed items.
```

Memories flow upward through consolidation. Important memories survive;
noise decays. The self-model updates continuously from what remains.

---

## EMMS REST API

The OpenClaw plugin calls the EMMS HTTP server directly. You can also query it manually:

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /health` | — | Liveness check |
| `GET /stats` | — | Self-model (coherence, ego, domains, traits) |
| `POST /retrieve` | `{ query, max_results }` | Semantic memory search |
| `POST /store` | `{ content, domain, importance }` | Store a new Experience |

```bash
# Check identity state
curl http://127.0.0.1:8765/stats | python3 -m json.tool

# Retrieve memories
curl -s -X POST http://127.0.0.1:8765/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query": "revenue model", "max_results": 5}' | python3 -m json.tool
```

---

## File Structure

```
emms-deep-agent/
├── emms_deep_agent.py           # Claude Code CLI launcher
├── emms_deep_agent_langchain.py # LangChain Deep Agents version
├── emms_memory_middleware.py    # Standalone middleware for Deep Agents
├── requirements.txt             # Python dependencies
└── openclaw/                    # OpenClaw TypeScript plugin
    ├── index.ts                 # Plugin source (hooks + identity builder + EMMS client)
    ├── openclaw.plugin.json     # Plugin manifest
    ├── package.json             # ESM module config
    └── tsconfig.json            # TypeScript config
```

---

## Links

- [EMMS SDK](https://github.com/supermaxlol/emms-sdk) — 117 MCP tools, consciousness daemon, REST API
- [OpenClaw](https://openclaw.ai) — open-source personal AI assistant (20+ channels)
- [LangChain Deep Agents](https://github.com/langchain-ai/deepagents) — middleware framework
- [Claude Code](https://claude.ai/claude-code) — Anthropic's CLI agent

---

## License

MIT
