from supabase import create_client, Client
import os

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def get_sales_data():
    response = supabase.table("sales").select("*").execute()
    return response.data

def get_forecast_data():
    response = supabase.table("forecast").select("*").execute()
    return response.data

def preview_order(order_details):
    response = supabase.table("orders").insert(order_details).execute()
    return response.data