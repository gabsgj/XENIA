XENIA – AI Study Suite (Frontend)

**Live Demo**: [https://xenia.onrender.com](https://xenia.onrender.com)

Tech
- Next.js App Router, TypeScript, Tailwind v4, shadcn/ui, Radix UI
- TanStack Query, Supabase Auth, RHF + Zod
- Recharts, Framer Motion, next-themes
- Error handling: global error context, code+message propagation, sonner toasts

Env
Create `.env.local`:
```
# For local development:
NEXT_PUBLIC_API_URL=http://localhost:8000
# For production (deployed on Render):
# NEXT_PUBLIC_API_URL=https://xenia-backend-1f0z.onrender.com
NEXT_PUBLIC_SUPABASE_URL=...your supabase url...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...your anon key...
```

Develop
```
npm i
npm run dev
```

Deploy
The frontend is currently deployed on Render at: https://xenia.onrender.com

For deployment on Vercel:
- Set env vars above in Vercel Project Settings.
- Use `NEXT_PUBLIC_API_URL=https://xenia-backend-1f0z.onrender.com` for production.
- `npm run build` then deploy.

For deployment on Render:
- Configure environment variables in Render dashboard.
- Build command: `npm run build`
- Start command: `npm run start`

Error Contract
Backend returns
```
{ "errorCode": "PLAN_500", "errorMessage": "...", "details": { ... } }
```
Frontend displays toasts and friendly error pages, logs correlation IDs when present.
