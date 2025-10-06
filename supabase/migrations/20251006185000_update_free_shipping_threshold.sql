-- Update the free shipping method to have a 50,000 FCFA threshold
UPDATE shipping_methods
SET 
  free_shipping_threshold = 50000.00,
  description = 'Livraison gratuite partout au Sénégal (à partir de 50 000 FCFA)'
WHERE name = 'Livraison Gratuite' AND price = 0;

