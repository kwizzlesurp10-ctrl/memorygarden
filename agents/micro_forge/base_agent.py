"""
Base MicroAgent class for the Swarm Micro-Forge pattern.

Provides a foundation for specialized micro-agents with
common functionality including reporting and chaotic energy generation.
"""

import random


class AetherWisp:
    """Helper class for generating chaotic energy flourishes."""

    def chaotic_flourish(self):
        """Generate a random chaotic energy value."""
        return random.random()


class MicroAgent:
    """Base class for all micro-agents in the Swarm Micro-Forge."""

    def __init__(self, name):
        self.name = name
        self.wisp = AetherWisp()

    def report(self, message):
        """Report agent activity."""
        print(f"[{self.name}] {message}")

    def run(self, context):
        """Execute the agent's main task. Override in subclasses."""
        raise NotImplementedError("Subclasses must implement run()")
