from fastapi import APIRouter, HTTPException
from typing import List
from ..db.supabase import get_sales_data

router = APIRouter()

@router.get("/sales", response_model=List[dict])
async def read_sales():
    sales_data = await get_sales_data()
    if not sales_data:
        raise HTTPException(status_code=404, detail="Sales data not found")
    return sales_data