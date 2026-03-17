// Supabase config - use .env.local with VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY
// See .env.example for the template
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!projectId || !publicAnonKey) {
  throw new Error('Missing VITE_SUPABASE_PROJECT_ID or VITE_SUPABASE_ANON_KEY. Add them to .env.local (see .env.example).');
}

export { projectId, publicAnonKey };