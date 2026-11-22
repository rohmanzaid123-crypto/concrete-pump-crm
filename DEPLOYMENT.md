# CPMS deployment checklist

## Runtime
- Node.js 22 or newer
- Install: `npm install`
- Build frontend: `npm run build`
- Start server: `npm start`
- The server listens on `PORT` (defaults to 3000).

## Required environment variables

Set these in the hosting provider's server/build environment. Do not commit real keys.

- `VITE_SUPABASE_URL`: active Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase publishable key (or legacy anon key)
- `SUPABASE_URL`: same active Supabase project URL, used by the Express server
- `SUPABASE_ANON_KEY`: same publishable/anon key, used by the Express server to verify user sessions

Optional:
- `GEMINI_API_KEY`: server-side AI provider key. Never prefix this with `VITE_`.

## Security notes before public launch
- Production frontend ignores browser localStorage overrides and requires build-time Supabase environment variables.
- Never expose a Supabase secret/service_role key in frontend variables.
- Create owner/admin accounts in Supabase Auth and assign their roles through a trusted database/admin process. Do not use public signup as an owner provisioning mechanism.
- Customer-service and owner-finance AI endpoints intentionally return unavailable until connected to verified production data. Do not re-enable mock prices, sample availability, or sample financial reports.
- Enable Supabase leaked-password protection in Authentication password/security settings.
- Configure the hosting provider's HTTPS/custom domain and verify `/api/health` after deployment.
- Run the GitHub Actions CI workflow and confirm type-check and production build pass before launch.
