-- Mettre à jour admin_id et admin_name pour les événements disconnectByAdmin
UPDATE agent_connections_history ach
SET admin_id = u.id,
    admin_name = u.firstname || ' ' || u.lastname
FROM users u
WHERE ach.event_type = 'disconnectByAdmin'
  AND ach.admin_id IS NULL
  AND ach.admin_name IS NULL
  AND ach.user_id = u.id;
