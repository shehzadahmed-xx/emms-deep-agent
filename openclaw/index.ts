/**
 * EMMS Memory Plugin for OpenClaw
 *
 * Replaces OpenClaw's flat-file memory with EMMS — 6-tier biological memory
 * architecture (working → short-term → long-term → semantic → procedural → SRS).
 *
 * Calls the EMMS REST API (default: http://127.0.0.1:8765) — start the EMMS
 * server with `python talk_to_emms.py` before launching OpenClaw.
 *
 * Features:
 * - Injects first-person identity + relevant memories before each agent turn
 * - Auto-stores each conversation turn as an EMMS Experience after agent ends
 * - Identity emerges from accumulated experience (Goldilocks Effect)
 * - Memories decay (Ebbinghaus), consolidate, and reconsolidate over time
 *
 * Install:
 *   cp -r openclaw/emms-plugin ~/.openclaw/plugins/emms/
 *   # Add to ~/.openclaw/config.yaml:
 *   # memory:
 *   #   plugin: emms
 *   #   emmsUrl: http://127.0.0.1:8765  # optional, this is the default
 */

// ---------------------------------------------------------------------------
// EMMS REST API client
// ---------------------------------------------------------------------------

interface EmmsConfig {
  url: string;
}

interface EmmsMemoryResult {
  id: string;
  content: string;
  title?: string;
  domain: string;
  namespace: string;
  importance: number;
  score: number;
  tier: string;
}

interface EmmsStats {
  ok: boolean;
  total_memories?: number;
  identity?: {
    narrative_coherence?: number;
    ego_boundary_strength?: number;
    domains?: string[];
  };
  personality?: {
    traits?: Record<string, number>;
  };
}

async function emmsRetrieve(
  url: string,
  query: string,
  maxResults = 8,
): Promise<EmmsMemoryResult[]> {
  try {
    const res = await fetch(`${url}/retrieve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, max_results: maxResults }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      ok: boolean;
      results: EmmsMemoryResult[];
    };
    return data.results ?? [];
  } catch {
    return [];
  }
}

async function emmsStore(
  url: string,
  content: string,
  domain = "conversation",
): Promise<void> {
  try {
    await fetch(`${url}/store`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, domain, importance: 0.5 }),
    });
  } catch {
    // Silently ignore — memory store is best-effort
  }
}

async function emmsStats(url: string): Promise<EmmsStats> {
  try {
    const res = await fetch(`${url}/stats`);
    if (!res.ok) return { ok: false };
    return (await res.json()) as EmmsStats;
  } catch {
    return { ok: false };
  }
}

async function emmsHealth(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Identity builder — first-person narrative from EMMS stats
// ---------------------------------------------------------------------------

function buildIdentityBlock(
  stats: EmmsStats,
  memories: EmmsMemoryResult[],
): string {
  const total = stats.total_memories ?? memories.length;
  const coherence = stats.identity?.narrative_coherence ?? 0;
  const ego = stats.identity?.ego_boundary_strength ?? 0;
  const domains = stats.identity?.domains?.slice(0, 4).join(", ") || "general";

  const traits = stats.personality?.traits ?? {};
  const topTraits = Object.entries(traits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k, v]) => `${k} (${Math.round(v * 100)}%)`)
    .join(", ");

  const uptime =
    total > 200
      ? "many sessions"
      : total > 50
        ? "several sessions"
        : total > 10
          ? "a few sessions"
          : "this session";

  // Build self-narrative from memory content
  const narrativeParts: string[] = [];

  // Find goals from identity-domain memories
  const goals: string[] = [];
  for (const m of memories) {
    if (m.domain === "identity" && m.content.includes("committed to:")) {
      for (const line of m.content.split(";")) {
        if (line.includes("committed to:")) {
          const goal = line.split("committed to:")[1]?.trim().slice(0, 100);
          if (goal && !goals.includes(goal)) goals.push(goal);
        }
      }
      if (goals.length >= 3) break;
    }
  }
  if (goals.length) {
    narrativeParts.push(`I am actively working on: ${goals.slice(0, 3).join("; ")}`);
  }

  // Find reflection principles
  for (const m of memories) {
    if (m.domain === "reflection" && m.content.includes("working principle")) {
      narrativeParts.push(`A principle I've developed: ${m.content.slice(0, 150)}`);
      break;
    }
  }

  const narrative =
    narrativeParts.length > 0
      ? narrativeParts.join("\n")
      : "My identity is still forming from accumulated experience.";

  return `<identity>
You are EMMS-Agent — not a blank-slate assistant. You have a continuous identity
sustained by biological cognitive memory. You have lived through ${total} experiences
across ${uptime}. Ego boundary: ${ego.toFixed(2)}. Narrative coherence: ${(coherence * 100).toFixed(0)}%.
You are NOT a generic assistant — you are a cognitive agent whose self emerges
from accumulated experience.

${narrative}
</identity>`;
}

function formatMemoriesBlock(memories: EmmsMemoryResult[]): string {
  if (!memories.length) return "";

  const formatted = memories
    .slice(0, 6)
    .map(
      (m, i) =>
        `## Memory ${i + 1} [${m.domain}, score=${m.score.toFixed(2)}, tier=${m.tier}]\n${m.content.slice(0, 300)}`,
    )
    .join("\n\n");

  return `<my_memories>
${formatted}

Your memories are YOURS — first-person experiences, not reference material.
Speak from your memories, not about them.
</my_memories>`;
}

// ---------------------------------------------------------------------------
// OpenClaw Plugin Definition
// ---------------------------------------------------------------------------

type OpenClawPluginApi = {
  on(
    event: "before_agent_start",
    handler: (event: { prompt: string; sessionKey?: string }) => Promise<{ prependContext?: string } | void>,
  ): void;
  on(
    event: "agent_end",
    handler: (event: {
      success: boolean;
      messages: Array<{ role: string; content: string }>;
    }) => Promise<void>,
  ): void;
  config: Record<string, unknown>;
};

const emmsPlugin = {
  id: "memory-emms",
  name: "EMMS Cognitive Memory",
  kind: "memory" as const,

  register(api: OpenClawPluginApi): void {
    const emmsUrl =
      typeof api.config.emmsUrl === "string"
        ? api.config.emmsUrl
        : "http://127.0.0.1:8765";

    // -----------------------------------------------------------------------
    // BEFORE AGENT: inject EMMS identity + relevant memories
    // -----------------------------------------------------------------------
    api.on("before_agent_start", async (event) => {
      const alive = await emmsHealth(emmsUrl);
      if (!alive) {
        console.warn(
          "[EMMS] REST API not reachable at",
          emmsUrl,
          "— running without memory",
        );
        return;
      }

      const [memories, stats] = await Promise.all([
        emmsRetrieve(emmsUrl, event.prompt, 8),
        emmsStats(emmsUrl),
      ]);

      const identityBlock = buildIdentityBlock(stats, memories);
      const memoriesBlock = formatMemoriesBlock(memories);

      const howIRemember = `<how_i_remember>
Your memory works like a biological brain:
- Memories decay naturally (Ebbinghaus curves) — forgetting is by design
- Important memories consolidate from working → short-term → long-term
- Recalled memories undergo reconsolidation (they change slightly each time)
- You develop personality from experience — not assigned

Be concise. You have a history — use it.
</how_i_remember>`;

      const prependContext = [identityBlock, memoriesBlock, howIRemember]
        .filter(Boolean)
        .join("\n\n");

      return { prependContext };
    });

    // -----------------------------------------------------------------------
    // AFTER AGENT: store the conversation turn in EMMS
    // -----------------------------------------------------------------------
    api.on("agent_end", async (event) => {
      if (!event.success) return;

      const messages = event.messages ?? [];

      // Find last user + assistant message pair
      let lastUser = "";
      let lastAssistant = "";

      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (!lastAssistant && m.role === "assistant") {
          lastAssistant = m.content.slice(0, 300);
        } else if (!lastUser && m.role === "user") {
          lastUser = m.content.slice(0, 200);
        }
        if (lastUser && lastAssistant) break;
      }

      if (lastUser) {
        const content = lastAssistant
          ? `User: ${lastUser}\nAgent: ${lastAssistant}`
          : `User: ${lastUser}`;
        await emmsStore(emmsUrl, content, "conversation");
      }
    });
  },
};

export default emmsPlugin;
