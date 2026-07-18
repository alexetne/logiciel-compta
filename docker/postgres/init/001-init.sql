-- Exécuté uniquement lors de la première création du volume PostgreSQL.
-- La base définie par POSTGRES_DB est créée par l'image officielle avant ce script.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS app;
COMMENT ON SCHEMA app IS 'Objets métier de ParaméCompta';

GRANT USAGE, CREATE ON SCHEMA app TO CURRENT_USER;
