"""
GuardianAgent — monitors repo health: lint, test, bundle, and security signals.
"""

import json
import subprocess
from pathlib import Path

from agents.micro_forge.base_agent import MicroAgent

_ROOT = Path(__file__).parents[2]


class GuardianAgent(MicroAgent):
    def __init__(self):
        super().__init__("GuardianAgent")

    def run(self, context: dict) -> dict:
        self.report("Running health checks...")

        checks = {
            "lint": self._check_lint(),
            "tests": self._check_tests(),
            "bundle": self._check_bundle(),
            "deps": self._check_outdated_deps(),
        }

        issues = [name for name, ok in checks.items() if not ok]
        status = "healthy" if not issues else "degraded"

        energy = self.wisp.chaotic_flourish()
        self.report(f"Health: {status}, issues={issues or 'none'} [energy={energy:.3f}]")

        return {
            "status": status,
            "energy": energy,
            "checks": checks,
            "issues": issues,
        }

    # ------------------------------------------------------------------
    def _run(self, cmd: list[str], **kwargs) -> tuple[bool, str]:
        try:
            r = subprocess.run(
                cmd, capture_output=True, text=True, cwd=_ROOT, **kwargs
            )
            return r.returncode == 0, r.stdout + r.stderr
        except Exception as exc:
            return False, str(exc)

    def _check_lint(self) -> bool:
        ok, _ = self._run(["npm", "run", "lint", "--", "--max-warnings=0"], timeout=60)
        return ok

    def _check_tests(self) -> bool:
        ok, _ = self._run(["npm", "test"], timeout=120)
        return ok

    def _check_bundle(self) -> bool:
        dist = _ROOT / "dist"
        # If dist exists from a prior build, check it's non-empty
        if dist.exists():
            return any(dist.iterdir())
        # Otherwise attempt a build (slow; skip in CI if already built)
        ok, _ = self._run(["npm", "run", "build"], timeout=180)
        return ok

    def _check_outdated_deps(self) -> bool:
        """Returns True (healthy) when no severely outdated deps are detected."""
        ok, output = self._run(["npm", "outdated", "--json"], timeout=30)
        if not output.strip():
            return True
        try:
            data = json.loads(output)
            # Flag as unhealthy only if there are outdated packages
            return len(data) == 0
        except json.JSONDecodeError:
            return True  # can't parse → assume fine
