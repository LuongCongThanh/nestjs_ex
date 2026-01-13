-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable trigram extension for text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test database for E2E testing
CREATE DATABASE ecommerce_test;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_test TO postgres;

-- Set default timezone to UTC
ALTER DATABASE ecommerce_db SET timezone TO 'UTC';
ALTER DATABASE ecommerce_test SET timezone TO 'UTC';

-- Log successful initialization
SELECT 'Database initialization completed successfully' AS status;
