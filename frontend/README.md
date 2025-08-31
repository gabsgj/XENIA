XENIA – AI Study Planner (Frontend)

Tech
- Next.js App Router, TypeScript, Tailwind v4, shadcn/ui, Radix UI
- TanStack Query, Supabase Auth, RHF + Zod
- Recharts, Framer Motion, next-themes
- Error handling: global error context, code+message propagation, sonner toasts

Env
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=...your supabase url...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...your anon key...
```

Develop
```
npm i
npm run dev
```

Deploy (Vercel)
- Set env vars above in Vercel Project Settings.
- `npm run build` then deploy.

Error Contract
Backend returns
```
{ "errorCode": "PLAN_500", "errorMessage": "...", "details": { ... } }
```
Frontend displays toasts and friendly error pages, logs correlation IDs when present.
