from typing import List, Dict
from fastapi import HTTPException
from ..db.supabase import get_supabase_client

async def generate_order_preview(sales_data: List[Dict], forecast_data: Dict) -> Dict:
    if not sales_data or not forecast_data:
        raise HTTPException(status_code=400, detail="Sales data or forecast data is missing")

    # Logic to generate order preview based on sales and forecast data
    order_preview = {}
    for item in forecast_data['items']:
        item_id = item['id']
        forecast_quantity = item['forecast_quantity']
        sales_quantity = sum(sale['quantity'] for sale in sales_data if sale['item_id'] == item_id)

        order_preview[item_id] = {
            'forecast_quantity': forecast_quantity,
            'sales_quantity': sales_quantity,
            'order_quantity': max(0, forecast_quantity - sales_quantity)
        }

    return order_preview

async def fetch_sales_data() -> List[Dict]:
    supabase = get_supabase_client()
    response = await supabase.from_("sales").select("*").execute()
    
    if response.error:
        raise HTTPException(status_code=500, detail="Error fetching sales data")
    
    return response.data

async def fetch_forecast_data() -> Dict:
    supabase = get_supabase_client()
    response = await supabase.from_("forecast").select("*").execute()
    
    if response.error:
        raise HTTPException(status_code=500, detail="Error fetching forecast data")
    
    return response.data