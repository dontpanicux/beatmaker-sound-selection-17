-- KV store table for Save Beats functionality
-- Run this in Supabase SQL Editor if not using migrations: supabase db push

CREATE TABLE IF NOT EXISTS kv_store_e44554cb (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
