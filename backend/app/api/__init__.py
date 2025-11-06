# backend/app/api/__init__.py

from fastapi import APIRouter

router = APIRouter()

from .routes import sales, forecast, order

router.include_router(sales.router, prefix="/sales", tags=["sales"])
router.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
router.include_router(order.router, prefix="/order", tags=["order"])