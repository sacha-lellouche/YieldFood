from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import sales, forecast, order

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sales.router)
app.include_router(forecast.router)
app.include_router(order.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the YieldFood API"}