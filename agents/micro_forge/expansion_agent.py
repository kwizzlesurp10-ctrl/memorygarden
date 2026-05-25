"""
ExpansionAgent — proposes new features by scanning PRD.md, recent git activity,
and developer snapshot files (.snapshots/*.md) for intent signals.
"""

import subprocess
from pathlib import Path

from agents.micro_forge.base_agent import MicroAgent

_ROOT = Path(__file__).parents[2]
_PRD_PATH = _ROOT / "PRD.md"
_SNAPSHOTS_DIR = _ROOT / ".snapshots"
_SNAPSHOT_IGNORE = {"readme.md", "sponsors.md"}


class ExpansionAgent(MicroAgent):
    def __init__(self):
        super().__init__("ExpansionAgent")

    def run(self, context: dict) -> dict:
        self.report("Scanning PRD, commits, and snapshots for expansion opportunities...")

        prd_snippet = self._read_prd()
        recent_commits = self._recent_commits()
        snapshot_signals = self._read_snapshots()
        proposals = self._derive_proposals(prd_snippet, recent_commits, snapshot_signals)

        energy = self.wisp.chaotic_flourish()
        self.report(
            f"Generated {len(proposals)} proposal(s), "
            f"{len(snapshot_signals)} snapshot(s) read [energy={energy:.3f}]"
        )

        return {
            "status": "success",
            "energy": energy,
            "proposals": proposals,
            "recent_commits": recent_commits,
            "snapshots_read": len(snapshot_signals),
        }

    # ------------------------------------------------------------------
    def _read_prd(self) -> str:
        if _PRD_PATH.exists():
            return _PRD_PATH.read_text(encoding="utf-8")[:4000]
        return ""

    def _recent_commits(self) -> list[str]:
        try:
            result = subprocess.run(
                ["git", "log", "--oneline", "-10"],
                capture_output=True,
                text=True,
                check=True,
                cwd=_ROOT,
            )
            return [line.strip() for line in result.stdout.splitlines() if line.strip()]
        except Exception:
            return []

    def _read_snapshots(self) -> list[str]:
        """Return combined text from recent snapshot files, newest-first, capped at 5."""
        if not _SNAPSHOTS_DIR.exists():
            return []
        snapshots = sorted(
            (
                f for f in _SNAPSHOTS_DIR.glob("*.md")
                if f.name.lower() not in _SNAPSHOT_IGNORE
            ),
            key=lambda f: f.stat().st_mtime,
            reverse=True,
        )
        texts = []
        for snap in snapshots[:5]:
            try:
                texts.append(snap.read_text(encoding="utf-8")[:2000])
            except Exception:
                pass
        return texts

    def _derive_proposals(
        self, prd: str, commits: list[str], snapshots: list[str]
    ) -> list[str]:
        proposals = []

        roadmap_keywords = {
            "canvas performance": "Canvas virtualization for large gardens (60fps at scale)",
            "seasonal": "Seasonal / time-of-day atmosphere polish",
            "accessibility": "Accessibility audit on modals and canvas controls",
            "llm fallback": "LLM fallback robustness + provider parity tests",
            "cluster": "Memory cluster navigation improvements",
            "audio": "Audio memory playback integration",
        }

        # Combine commits + snapshot text as the "active work" corpus
        active_corpus = " ".join(commits + snapshots).lower()

        for keyword, proposal in roadmap_keywords.items():
            if keyword not in active_corpus:
                proposals.append(proposal)

        # Surface topics the dev has been explicitly asking about in snapshots
        # but that don't appear in recent commits (unresolved intent signals)
        snapshot_corpus = " ".join(snapshots).lower()
        intent_keywords = {
            "performance": "Investigate performance issue noted in recent snapshot",
            "bug": "Review bug discussed in recent snapshot — may need a fix PR",
            "refactor": "Refactor task flagged in snapshot not yet in commits",
            "test": "Test coverage gap noted in snapshot",
        }
        for keyword, proposal in intent_keywords.items():
            lowered_commits = " ".join(commits).lower()
            if keyword in snapshot_corpus and keyword not in lowered_commits:
                proposals.append(proposal)

        return proposals[:5]
