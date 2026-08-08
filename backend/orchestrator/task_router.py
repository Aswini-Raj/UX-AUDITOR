from typing import List, Dict, Any

class AgentTaskRouter:
    """
    Evaluates system goals to map the required order of operations 
    and set execution constraints across sub-agents.
    """
    @staticmethod
    def map_pipeline_dependencies(goal: str) -> List[str]:
        base_pipeline = [
            "persona_manager",
            "browser_navigation",
            "data_collection"
        ]
        
        # Inject context-specific diagnostic steps based on target objectives
        if "checkout" in goal.lower() or "transaction" in goal.lower():
            base_pipeline.extend(["friction_detection", "severity_scoring", "fix_generation"])
        elif "accessibility" in goal.lower() or "wcag" in goal.lower():
            base_pipeline.extend(["accessibility_agent", "severity_scoring", "report_agent"])
        else:
            base_pipeline.extend(["heuristic_evaluation", "severity_scoring", "report_agent"])
            
        base_pipeline.append("retest_agent")
        return base_pipeline