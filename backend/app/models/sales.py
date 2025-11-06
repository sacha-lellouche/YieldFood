from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Sale(Base):
    __tablename__ = 'sales'

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, index=True)
    quantity_sold = Column(Integer)
    sale_price = Column(Float)
    sale_date = Column(String)  # Consider using Date type for better handling

    def __repr__(self):
        return f"<Sale(item_name={self.item_name}, quantity_sold={self.quantity_sold}, sale_price={self.sale_price}, sale_date={self.sale_date})>"