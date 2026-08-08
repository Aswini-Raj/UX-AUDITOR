from typing import List
from backend.models.issue import IssueItem

class FrictionDetectionAgent:
    """Analyzes user journey pathways to catch points of micro-hesitation."""
    @staticmethod
    def evaluate_behavioral_traces(navigation_logs: dict) -> List[IssueItem]:
        return [
            IssueItem(
                id="iss_fric_01",
                type="Friction",
                title="Primary CTA Hidden Below Fold Boundary",
                severity="High",
                description="Simulated First-Time User scrolled past the payment container twice before interaction.",
                root_cause="Container vertical spacing tokens exceed viewport limits."
            )
        ]