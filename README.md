# IMEI.info Admin Control Center milestone

Copy these files into the project:

- src/app/admin/page.js
- src/app/admin/admin.css
- src/app/api/admin/[...path]/route.js
- api/routes/admin.js

Then add these to `.env.local`:

ADMIN_API_KEY=YOUR_REGENERATED_ADMIN_API_KEY
API_URL=http://localhost:8000

Important:
1. Use a NEW API key because the old key was exposed in client-side code/conversation.
2. Do not use NEXT_PUBLIC_ADMIN_API_KEY.
3. Restart both servers after changing .env.local.

Run:
npm run api
npm run dev

Open:
http://localhost:3000/admin

The browser now calls Next.js `/api/admin/*`; the Next.js server forwards the request to Fastify with ADMIN_API_KEY. The key is therefore not shipped to the browser.

This milestone adds:
- Overview metrics
- API health
- 7-day request analytics
- HTTP status distribution
- Most-used endpoints
- API key table
- Recent requests table
- Per-key quota/limit cards
- Responsive admin layout
- Server-side API-key proxy
