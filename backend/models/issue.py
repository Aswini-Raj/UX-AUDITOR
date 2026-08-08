from pydantic import BaseModel

class IssueItem(BaseModel):
    id: str
    type: str # 'Friction' | 'WCAG' | 'Heuristic'
    title: str
    severity: str # 'Low' | 'Medium' | 'High' | 'Critical'
    description: str
    root_cause: str