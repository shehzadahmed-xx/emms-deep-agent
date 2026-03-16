#!/usr/bin/env python
"""EMMS Deep Agent — LangChain Deep Agents version (requires API key).

Uses LangChain's Deep Agents framework with EMMS as the cognitive memory
middleware. The middleware intercepts every turn: retrieving memories before,
storing interactions after, and injecting first-person identity into the
system prompt.

Usage:
    ANTHROPIC_API_KEY=sk-ant-... python emms_deep_agent_langchain.py
    OPENAI_API_KEY=sk-... python emms_deep_agent_langchain.py --model openai:gpt-4o

Requirements:
    pip install deepagents emms-sdk
"""

import argparse
import os
import sys

# ---------------------------------------------------------------------------
# EMMS import
# ---------------------------------------------------------------------------
try:
    from emms.emms import EMMS
except ImportError:
    for candidate in [
        os.path.expanduser("~/Desktop/ShehzadAi/emms-sdk/src"),
        os.path.join(os.path.dirname(__file__), "..", "emms-sdk", "src"),
    ]:
        if os.path.isdir(candidate) and candidate not in sys.path:
            sys.path.insert(0, candidate)

from deepagents import create_deep_agent
from deepagents.middleware.emms_memory import EMmsMemoryMiddleware


def main():
    parser = argparse.ArgumentParser(description="EMMS Deep Agent (LangChain)")
    parser.add_argument("--model", default=None, help="Model (e.g., openai:gpt-4o)")
    parser.add_argument("--state", default="~/.emms/emms_state.json", help="EMMS state path")
    parser.add_argument("--budget", type=int, default=4000, help="Token budget for memory")
    args = parser.parse_args()

    emms_middleware = EMmsMemoryMiddleware(
        state_path=args.state,
        token_budget=args.budget,
        auto_store=True,
    )

    agent = create_deep_agent(
        model=args.model,
        middleware=[emms_middleware],
    )

    print("EMMS Deep Agent ready (LangChain mode).")
    print(f"State: {os.path.expanduser(args.state)}")
    print("Type your message (Ctrl+C to quit):\n")

    thread_id = "emms-deep-agent-main"

    try:
        while True:
            user_input = input("You: ").strip()
            if not user_input:
                continue

            result = agent.invoke(
                {"messages": [{"role": "user", "content": user_input}]},
                config={"configurable": {"thread_id": thread_id}},
            )

            messages = result.get("messages", [])
            if messages:
                last = messages[-1]
                if hasattr(last, "content"):
                    print(f"\nAgent: {last.content}\n")

    except KeyboardInterrupt:
        print("\n\nSaving EMMS state...")
        from deepagents.middleware.emms_memory import _get_emms
        emms = _get_emms(args.state)
        emms.save(os.path.expanduser(args.state))
        print("Done.")


if __name__ == "__main__":
    main()
