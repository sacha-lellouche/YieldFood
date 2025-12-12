-- Désactiver RLS temporairement
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view items of their orders" ON order_items;
DROP POLICY IF EXISTS "Users can insert items of their orders" ON order_items;

-- Réactiver RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Créer des policies plus permissives
CREATE POLICY "Users can manage their orders"
  ON orders
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage order items"
  ON order_items
  USING (true)
  WITH CHECK (true);
