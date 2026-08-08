-- ──────────────────────────────────────────────────────────
--  UX Auditor — Database Bootstrap Script
--  Run once: psql -U postgres -f init_db.sql
-- ──────────────────────────────────────────────────────────

-- Create the database (run separately if it doesn't exist yet)
-- CREATE DATABASE ux_auditor;

-- Connect to it first: \c ux_auditor

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          TEXT        NOT NULL,
    email         TEXT        UNIQUE NOT NULL,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
