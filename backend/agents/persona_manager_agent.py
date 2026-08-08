from typing import List, Dict
from backend.models.persona import PersonaProfile

class PersonaManagerAgent:
    """Instantiates the specific testing profiles needed for the current goal."""
    @staticmethod
    def generate_synthetic_audience(goal: str) -> List[Dict[str, Any]]:
        # Tailors active user profiles depending on the goal parameter
        return [
            {"name": "First-Time User", "focus": "Struggles with dynamic onboarding setups"},
            {"name": "Elderly User", "focus": "Readability metrics and low-contrast elements"},
            {"name": "Mobile Consumer", "focus": "Viewport constraint structural rendering flaws"},
            {"name": "Accessibility User", "focus": "Deviations from logical keyboard DOM layouts"}
        ]