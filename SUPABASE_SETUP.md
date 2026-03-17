# Supabase Setup for Save Beats

Follow these steps to connect the Beat Sequencer to your Supabase backend.

## 1. Add Your Credentials

Edit `.env.local` and replace the placeholders with your Supabase credentials:

```
VITE_SUPABASE_PROJECT_ID=your_actual_project_ref
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
```

Get these from: **Supabase Dashboard → Project Settings → API**

## 2. Create the KV Store Table

**Option A: Supabase SQL Editor**

1. Open your project in [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Run the SQL from `supabase/migrations/20240304000000_create_kv_store.sql`:

```sql
CREATE TABLE IF NOT EXISTS kv_store_e44554cb (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
```

**Option B: Supabase CLI** (if linked)

```bash
pnpm supabase:db-push
```

## 3. Deploy the Edge Function

```bash
# Log in to Supabase (opens browser)
pnpm supabase:login

# Link to your project (prompts for project ref - use the same value as VITE_SUPABASE_PROJECT_ID)
pnpm supabase:link

# Deploy the function
pnpm supabase:deploy
```

Or run manually:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest functions deploy make-server-e44554cb
```

## 4. Verify

1. Run `pnpm dev` and open http://localhost:5173
2. Sign up or log in
3. Create a beat pattern and click **Save Beat**
4. Click **Open Beat** to see your saved beats
