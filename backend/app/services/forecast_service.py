from typing import List
from fastapi import HTTPException
from app.db.supabase import get_sales_data

class ForecastService:
    def __init__(self):
        pass

    def calculate_forecast(self, sales_data: List[dict]) -> dict:
        # Implement your forecasting logic here
        # This is a placeholder for the actual forecasting algorithm
        forecast = {}
        for sale in sales_data:
            item = sale['item']
            quantity = sale['quantity']
            if item in forecast:
                forecast[item] += quantity
            else:
                forecast[item] = quantity
        return forecast

    def get_forecast(self) -> dict:
        sales_data = get_sales_data()
        if not sales_data:
            raise HTTPException(status_code=404, detail="No sales data found")
        return self.calculate_forecast(sales_data)