Grailix Development Contract

Windsurf must follow these rules:

Code Rules

Use TypeScript everywhere

Follow the folder structure strictly

Keep each component small and reusable

Always use async/await

API routes respond with { success: boolean, data, error }

No hardcoded env values – use process.env

Keep file names consistent and clean

Document complex functions with comments

Database Rules

Use Supabase client (never raw SQL in backend)

Always map correct table columns

Prevent duplicate stakes (unique check)

Update sentiment and pool totals atomically

UI Rules

Mobile-first (swipe UX priority)

Desktop should show YES/NO buttons

Clean minimal design

Tailwind only

Agent Rules

Create empty skeletons first

Resolver must use deterministic logic

Hashing must use utils in /lib/hashUtils.ts

Deployment Rules

No code referencing local-only paths

Use only supported Next.js features

Keep agents independent of frontend