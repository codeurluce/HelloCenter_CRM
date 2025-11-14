-- Ajouter les colonnes pour les infos de l'audit
ALTER TABLE sales
ADD COLUMN audite_commentaire TEXT,
ADD COLUMN audite_by_id INTEGER REFERENCES users(id),
ADD COLUMN audite_by_name TEXT;

-- Création de la fonction trigger
CREATE OR REPLACE FUNCTION set_audite_by_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Si audite_by_id est renseigné et audite_by_name est NULL ou vide
    IF NEW.audite_by_id IS NOT NULL AND (NEW.audite_by_name IS NULL OR NEW.audite_by_name = '') THEN
        SELECT CONCAT(firstname, ' ', lastname) 
        INTO NEW.audite_by_name
        FROM users
        WHERE id = NEW.audite_by_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger sur la table sales
CREATE TRIGGER trigger_set_audite_by_name
BEFORE INSERT OR UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION set_audite_by_name();
