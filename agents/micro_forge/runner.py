"""
Micro-Forge runner -- executes all agents and writes a Markdown report to stdout
(compatible with GitHub Actions $GITHUB_STEP_SUMMARY).

Usage:
    python -m agents.micro_forge.runner [--mode full-scan|bug-triage|guardian-only]
"""

import argparse
import sys
from datetime import datetime, timezone

from agents.micro_forge.expansion_agent import ExpansionAgent
from agents.micro_forge.guardian_agent import GuardianAgent
from agents.micro_forge.memory_reflector import MemoryReflector


def _section(title: str) -> str:
    return f"\n## {title}\n"


def run(mode: str = "full-scan") -> str:
    lines: list[str] = []
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines.append(f"# Micro-Forge Agent Report -- {ts}\n")
    lines.append(f"**Mode**: `{mode}`\n")

    guardian = GuardianAgent()
    g_result = guardian.run({})
    lines.append(_section("Guardian -- Repo Health"))
    status_tag = "[OK]" if g_result["status"] == "healthy" else "[!]"
    lines.append(f"{status_tag} **{g_result['status'].upper()}**\n")
    for check, ok in g_result["checks"].items():
        icon = "[pass]" if ok else "[FAIL]"
        lines.append(f"- {icon} `{check}`")
    if g_result["issues"]:
        lines.append(f"\n**Issues detected**: {', '.join(g_result['issues'])}")

    if mode in ("full-scan",):
        reflector = MemoryReflector()
        r_result = reflector.run({})
        lines.append(_section("Memory Reflector"))
        lines.append(f"Status: `{r_result['status']}`")

        expansion = ExpansionAgent()
        e_result = expansion.run({})
        lines.append(_section("Expansion -- Feature Proposals"))
        if e_result["proposals"]:
            for p in e_result["proposals"]:
                lines.append(f"- {p}")
        else:
            lines.append("No new proposals -- all roadmap items appear active in recent commits.")

        if e_result["recent_commits"]:
            lines.append("\n**Recent commits sampled**:")
            for c in e_result["recent_commits"][:5]:
                lines.append(f"  - `{c}`")

        n = e_result.get("snapshots_read", 0)
        if n:
            lines.append(f"\n**Developer snapshots read**: {n} (intent signals included in proposals)")

    lines.append(_section("Next Steps"))
    lines.append(
        "Use `evolution_request.yml` to open a tracking issue, "
        "or assign to @copilot / comment with goal + 'follow AGENT_WORKFLOW.md'."
    )

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Micro-Forge agent runner")
    parser.add_argument(
        "--mode",
        choices=["full-scan", "bug-triage", "guardian-only"],
        default="full-scan",
    )
    args = parser.parse_args()
    print(run(args.mode))


if __name__ == "__main__":
    main()
