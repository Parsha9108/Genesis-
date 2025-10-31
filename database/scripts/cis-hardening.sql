-- Simple working CIS hardening script
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create roles using simple syntax (no IF NOT EXISTS)
CREATE ROLE db_readonly;
CREATE ROLE db_readwrite; 
CREATE ROLE db_admin;

-- Basic permissions
GRANT CONNECT ON DATABASE genesis_database TO db_readonly;
GRANT USAGE ON SCHEMA public TO db_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO db_readonly;

GRANT CONNECT ON DATABASE genesis_database TO db_readwrite;
GRANT USAGE ON SCHEMA public TO db_readwrite;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO db_readwrite;

-- Remove dangerous functions
REVOKE ALL ON FUNCTION pg_ls_dir(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION pg_read_file(text) FROM PUBLIC;

-- Success message
SELECT 'CIS Hardening Completed Successfully' AS result;


