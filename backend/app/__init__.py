from fastapi import FastAPI

app = FastAPI()

from .api.routes import sales, forecast, order

app.include_router(sales.router)
app.include_router(forecast.router)
app.include_router(order.router)