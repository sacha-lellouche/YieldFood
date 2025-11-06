from pydantic import BaseModel
from typing import List, Optional

class Forecast(BaseModel):
    ingredient: str
    quantity: float
    unit: str

class ForecastResponse(BaseModel):
    forecast: List[Forecast]
    total_quantity: float
    message: Optional[str] = None