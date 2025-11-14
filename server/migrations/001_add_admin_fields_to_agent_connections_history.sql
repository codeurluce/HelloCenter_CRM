-- Ajouter les colonnes pour stocker l'admin qui déconnecte
ALTER TABLE agent_connections_history
ADD COLUMN IF NOT EXISTS admin_id INTEGER;

ALTER TABLE agent_connections_history
ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255);
