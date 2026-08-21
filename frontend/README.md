# YAXIS — Frontend (Vercel)

This is the static frontend, deployed to Vercel. It's a snapshot of the
PHP-rendered homepage, with all relative URLs rewritten to point at the
backend on Namecheap.

## Files

```
frontend/
├── index.html          ← Pre-rendered static HTML (the actual site)
├── assets/             ← CSS, JS, fonts
│   ├── css/            ← tokens, reset, base, components, sections
│   └── js/             ← main.js (GSAP + counters), nav.js
├── build.sh            ← Re-renders index.html from the PHP backend
├── vercel.json         ← Vercel config (cache + security headers)
├── .env.example        ← Copy to .env (or set in Vercel dashboard)
└── README.md           ← This file
```

## Build

```bash
# 1. Set the env vars (or put them in .env)
export BACKEND_URL=https://yaxis.lodev.store
export FRONTEND_URL=https://yaxis.vercel.app

# 2. Run the build script
./build.sh

# 3. Deploy to Vercel
vercel --prod
```

`build.sh` does the following:

1. Starts a temporary PHP server in the **project root** (`php -S 127.0.0.1:8766 -t ..`)
2. Fetches the rendered HTML from `http://127.0.0.1:8766/index.php`
3. Rewrites relative URLs:
   - `/api/setlang.php?lang=xx&next=*` → `${BACKEND_URL}/api/setlang.php?lang=xx&next=${FRONTEND_URL}`
   - `/uploads/...` → `${BACKEND_URL}/uploads/...`
   - `https://yaxis.lodev.store` (canonical, og:url) → `${FRONTEND_URL}`
4. Writes the result to `frontend/index.html`

## Environment variables

| Var | Example | Purpose |
|---|---|---|
| `BACKEND_URL` | `https://yaxis.lodev.store` | The PHP backend origin. Used to rewrite `/api/...` and `/uploads/...` to absolute URLs. |
| `FRONTEND_URL` | `https://yaxis.vercel.app` | This Vercel deployment. Used as the `next=` param for the language switcher, so the user lands back on the Vercel origin after switching language. |

In Vercel, set these under **Project Settings → Environment Variables**.
Locally, set them in your shell or copy `.env.example` to `.env`.

## What the pre-rendered HTML does NOT include

- **No PHP at runtime.** The page is a pure static file. Every value you see was
  read from the DB at the moment `build.sh` was run. After the admin updates
  the DB on the backend, you must re-run `build.sh` and re-deploy for the
  Vercel copy to reflect the change.
- **No live language switching.** The language switcher links point at
  `${BACKEND_URL}/api/setlang.php?lang=xx&next=${FRONTEND_URL}`. Clicking them
  sets a cookie on the BACKEND domain and redirects back to the Vercel origin.
  The static HTML on Vercel then reads the cookie via `document.cookie` if any
  client-side code needs it (currently it doesn't — the page renders in the
  default language baked at build time).

## What the pre-rendered HTML DOES include

- All HTML, CSS, JS (the entire portfolio as it would render server-side).
- Hard-coded `wa.me/...` WhatsApp links (no backend needed).
- CDN scripts (GSAP, Google Fonts).
- Project / testimonial / process data baked in from the DB at build time.

## Re-deploying after admin changes

```bash
./build.sh && vercel --prod
```

For a fully automated flow, set up a Vercel deploy hook and have the admin
trigger it after saving. The hook is a URL you can POST to from PHP:

```php
// in admin/save.php after a successful update:
file_get_contents(getenv('VERCEL_DEPLOY_HOOK'));
```

For now, manual re-deploys are the simplest path.
