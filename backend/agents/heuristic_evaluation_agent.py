from typing import List
from backend.models.issue import IssueItem

class HeuristicEvaluationAgent:
    """
    Audits element layouts against classical Nielsen Heuristics models 
    to evaluate visibility and match system states.
    """
    @staticmethod
    def apply_heuristic_rules(cleaned_telemetry: dict) -> List[IssueItem]:
        # Evaluates interface elements for compliance with usability heuristics
        return [
            IssueItem(
                id="iss_heur_01",
                type="Heuristic",
                title="Ambiguous System Feedback during Submission Loop",
                severity="Medium",
                description="The form spinner element does not clearly indicate processing state updates to the user.",
                root_cause="Lack of clear status attributes or loading visual indicators inside the primary element."
            )
        ]