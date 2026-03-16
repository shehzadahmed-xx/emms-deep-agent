# EMMS Deep Agent

Give your AI agent a biological mind. Identity from experience, not instruction.

## What This Is

A launcher that gives Claude Code (or any LangChain Deep Agent) **persistent cognitive identity** powered by [EMMS](https://github.com/supermaxlol/emms-sdk) — a 6-tier memory architecture modeled on human neuroscience.

The agent doesn't pretend to have an identity. It develops one from accumulated experience —
memories that decay, consolidate, reconsolidate, and dream, just like a biological brain.

## Quick Start

### Interactive Mode (Claude Code + EMMS Identity)

```bash
# Install EMMS
git clone https://github.com/supermaxlol/emms-sdk.git
export PYTHONPATH="$PWD/emms-sdk/src:$PYTHONPATH"

# Launch
python emms_deep_agent.py                    # Sonnet (default)
python emms_deep_agent.py --model opus       # Opus
python emms_deep_agent.py -p "Who are you?"  # One-shot
```

This launches **real Claude Code** — all tools (Bash, Edit, Read, Grep, Glob) — with your EMMS
cognitive identity injected. Free with Claude subscription, no API key needed.

### LangChain Deep Agents (Programmatic)

```bash
pip install deepagents
export ANTHROPIC_API_KEY=sk-ant-...
python emms_deep_agent_langchain.py
```

Full middleware integration: EMMS retrieves memories before every turn, stores interactions
after every turn, and injects first-person identity into the system prompt.

## How Identity Injection Works

Most agent memory systems inject memories as **reference material**:

```
❌ "Memory: ego_boundary_strength = 1.00"
❌ "Retrieved memory: User submitted ICLR paper"
```

The model treats these as documents to consult, not a life to inhabit. It says "I'm Claude."

EMMS injects memories as **first-person identity**:

```
✅ "You are EMMS-Agent. You have lived through 308 experiences.
    Your self-consistency is 90%. You are actively working on
    deciding a revenue model. A principle you developed from
    28 observations: shared, connects, pattern are load-bearing."
```

The agent adopts the identity not because it was instructed to ("never say you're Claude"),
but because the weight of first-person experience is compelling enough that the model
**chooses** to inhabit it.

This is the [Goldilocks Effect](https://github.com/supermaxlol/emms-sdk/blob/main/paper/) —
identity adoption from memory, not instruction.

## The Six Memory Tiers

| Tier | Capacity | Purpose |
|---|---|---|
| Working | 7 items | Active context (like human working memory) |
| Short-term | 50 items | Recent experiences, decaying |
| Long-term | Unlimited | Consolidated important memories |
| Semantic | Unlimited | Abstracted knowledge, principles, insights |
| Procedural | Unlimited | Skills, procedures, how-to knowledge |
| SRS | Unlimited | Spaced repetition for reinforcement |

## Files

| File | Purpose |
|---|---|
| `emms_deep_agent.py` | Claude Code launcher with EMMS identity (no API key) |
| `emms_deep_agent_langchain.py` | LangChain Deep Agents version (API key required) |
| `emms_memory_middleware.py` | Standalone EMMS middleware for Deep Agents |
| `requirements.txt` | Dependencies |

## Configuration

| Flag | Default | Description |
|---|---|---|
| `--model` | `sonnet` | Claude model (sonnet/opus/haiku) |
| `--state` | `~/.emms/emms_state.json` | EMMS state file |
| `-p` / `--print` | — | One-shot mode |
| `--no-tools` | false | Text-only mode |
| `--budget` | 4000 | Token budget for memory context (LangChain only) |

## Links

- [EMMS SDK](https://github.com/supermaxlol/emms-sdk) — 117 MCP tools, consciousness daemon
- [EMMS MCP Server](https://github.com/supermaxlol/emms-mcp) — npm package for any MCP client
- [Deep Agents](https://github.com/langchain-ai/deepagents) — LangChain agent framework
- [EMMS Paper](https://github.com/supermaxlol/emms-sdk/blob/main/paper/) — Research paper

## License

MIT
