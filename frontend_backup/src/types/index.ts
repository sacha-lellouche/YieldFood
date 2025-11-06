export interface Sale {
  id: number;
  item: string;
  quantity: number;
  date: string;
}

export interface Forecast {
  item: string;
  predictedQuantity: number;
}

export interface OrderPreview {
  item: string;
  quantity: number;
  totalCost: number;
}