# Backend logic split: Next.js API routes + Supabase Edge Functions

Request-driven backend logic (route optimization, Call logging, re-plan requests) lives in Next.js API routes deployed on Vercel. Database-triggered operations (geocoding HCP addresses on CSV import) run as Supabase Edge Functions, colocated with the database to avoid round-trip latency on bulk operations.

A single-runtime approach (all Next.js or all Edge Functions) was considered. All-Next.js would require Vercel to handle CSV geocoding, adding cold-start latency on bulk imports and coupling an import pipeline to the web server. All-Edge-Functions would fragment the TypeScript codebase across Deno and Node runtimes. The split keeps each operation in its natural home.
