from fastapi import APIRouter, HTTPException
from typing import List
from app.models.forecast import Forecast
from app.services.forecast_service import calculate_forecast

router = APIRouter()

@router.get("/", response_model=List[Forecast])
async def get_forecast():
    try:
        forecast_data = calculate_forecast()
        return forecast_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))