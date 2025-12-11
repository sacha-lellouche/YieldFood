-- Migration pour ajouter un champ name aux consommations
-- Ce champ permet de donner un nom personnalisé à chaque validation de consommation

-- Ajouter la colonne name (nullable car les consommations existantes n'en ont pas)
ALTER TABLE public.consumptions 
ADD COLUMN IF NOT EXISTS name text;

-- Créer un index pour faciliter la recherche par nom
CREATE INDEX IF NOT EXISTS idx_consumptions_name ON public.consumptions(name);

-- Mettre à jour les consommations existantes avec un nom par défaut
-- Format: "Consommation du DD/MM/YYYY à HH:MM"
UPDATE public.consumptions
SET name = CONCAT(
  'Consommation du ',
  TO_CHAR(consumption_date, 'DD/MM/YYYY'),
  ' à ',
  TO_CHAR(created_at, 'HH24:MI')
)
WHERE name IS NULL;
