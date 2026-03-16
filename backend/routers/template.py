


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.integrations.groq.util.GenerateTemplate import generate_template


router = APIRouter(prefix="/api/template", tags=["template"])


class GenerateTemplateRequest(BaseModel):
  guideline_prompt: str
  
@router.post("/generate")
def generateTemplate(request: GenerateTemplateRequest):
  try:
    return generate_template(request.guideline_prompt)
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))