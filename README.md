# Joga Bonito 2026

A full-stack, Vercel-ready auction website for a futsal tournament with:

- Separate male and female auction rooms
- 8 men's teams and 3 women's teams
- Team dashboards showing bought players
- Admin panel for uploading player cards and running the live auction
- Real-time bid updates with Supabase Realtime
- Vibrant, Joga Bonito inspired visual direction with a colorful neon palette
- Zero-cost starter stack: Next.js on Vercel + Supabase free tier

## Stack

- Next.js 15 + App Router + TypeScript
- Tailwind CSS
- Supabase Postgres
- Supabase Storage for player card uploads
- Supabase Realtime for live auction updates
- Vercel for hosting

## Pages

- `/` landing page
- `/login` custom username/password login
- `/auction` live bidding room
- `/teams/[slug]` team roster page
- `/admin` admin control room

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Generate a session secret with something like:

```bash
openssl rand -base64 32
```

## Database setup

1. Create a new Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. The schema already seeds all teams, auction rooms, and default login users.

## Default seeded credentials

The SQL file already creates these accounts:

- `admin` / `admin2026`
- `mteam1` / `mteam12026`
- `mteam2` / `mteam22026`
- `mteam3` / `mteam32026`
- `mteam4` / `mteam42026`
- `mteam5` / `mteam52026`
- `mteam6` / `mteam62026`
- `mteam7` / `mteam72026`
- `mteam8` / `mteam82026`
- `fteam1` / `fteam12026`
- `fteam2` / `fteam22026`
- `fteam3` / `fteam32026`

Change them immediately after the first setup if you plan to run the site in a real event.

## Local development

```bash
npm install
npm run dev
```

## Vercel deployment

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Add the same environment variables in the Vercel project settings.
4. Deploy.

## Recommended improvements

- Add countdown timers and auto-close logic
- Add bid activity feed by division
- Add drag-and-drop player card uploads
- Add sold/unsold archive page
- Add auction analytics and export buttons
