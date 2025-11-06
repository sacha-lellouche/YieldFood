from fastapi import APIRouter

router = APIRouter()

from .sales import router as sales_router
from .forecast import router as forecast_router
from .order import router as order_router

router.include_router(sales_router, prefix="/sales", tags=["sales"])
router.include_router(forecast_router, prefix="/forecast", tags=["forecast"])
router.include_router(order_router, prefix="/order", tags=["order"])