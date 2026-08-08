from pydantic import BaseModel
from typing import List

class PersonaProfile(BaseModel):
    id: str
    name: str
    focus: str
    traits: List[str]