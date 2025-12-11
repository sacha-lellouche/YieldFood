-- Add supplier_id column to stock table
ALTER TABLE stock ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stock_supplier_id ON stock(supplier_id);
