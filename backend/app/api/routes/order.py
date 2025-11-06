from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

class OrderPreview(BaseModel):
    ingredient: str
    quantity: int

@router.post("/order/preview", response_model=List[OrderPreview])
async def preview_order(sales_data: List[OrderPreview]):
    # Logic to generate order preview based on sales data
    if not sales_data:
        raise HTTPException(status_code=400, detail="Sales data is required")
    
    # Example logic for generating order preview
    order_preview = []
    for item in sales_data:
        # Here you would implement your logic to calculate the order preview
        order_preview.append(OrderPreview(ingredient=item.ingredient, quantity=item.quantity))
    
    return order_preview