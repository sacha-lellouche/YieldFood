from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer, primary_key=True, index=True)
    ingredient_name = Column(String, index=True)
    quantity = Column(Float)
    order_date = Column(String)  # Consider using Date or DateTime for better date handling
    restaurant_id = Column(Integer)  # Assuming there's a restaurant identifier

    def __repr__(self):
        return f"<Order(id={self.id}, ingredient_name={self.ingredient_name}, quantity={self.quantity}, order_date={self.order_date}, restaurant_id={self.restaurant_id})>"