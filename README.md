# Clan Bingo

A five-team bingo board with hidden second-layer tasks. Clearing layer 1 on a
tile reveals the layer 2 challenge underneath it. Anyone can view the board;
only the admin can tick tiles off or edit the task list. Team names and the
event title are editable from inside the site.

```
public/index.html   the whole board's front end
worker.js            handles the two API routes, then serves public/
wrangler.jsonc        Cloudflare config: static assets + the Worker
README.md
```

Cloudflare retired the old Pages dashboard flow (upload a build-output folder,
drag in a `functions/` directory). Everything now deploys as a single Worker:
`worker.js` runs first for `/api/*` requests and hands everything else to the
static files in `public/`, per `wrangler.jsonc`.

## Deploy from GitHub

1. Push this whole folder to a GitHub repo (upload through the GitHub website
   is fine — no need for git commands).
2. Cloudflare dashboard → **Workers & Pages → Create → Connect to Git** (it
   may just be labelled "Create an app" now) → pick your repo.
3. Leave **Build command** empty. **Deploy command** should already default to
   `npx wrangler deploy` — leave it. **Path** stays `/`.
4. Click **Deploy**. You'll get a live `*.workers.dev` link.

At this point the board works, but progress is only saved in your own browser
— everyone else sees a fresh board. To share progress:

## Turn on shared progress

1. Cloudflare dashboard → **Storage & Databases → KV → Create namespace**,
   name it anything (e.g. `clan-bingo`). Copy its ID.
2. Open `wrangler.jsonc` in your repo and uncomment/add:
   ```json
   "kv_namespaces": [ { "binding": "BINGO", "id": "PASTE_THE_ID_HERE" } ]
   ```
   Commit that change — it triggers a redeploy.
3. In your Worker's **Settings → Variables and Secrets → Add**: name it
   `ADMIN_PASSWORD`, set it as a **Secret**, give it a password.
4. Redeploy if it doesn't happen automatically (Deployments → retry latest).

The page detects the backend automatically — the badge under the board
switches from "Saved in this browser" to "Shared with everyone". Viewers pick
up changes within about 15 seconds.

The password is checked inside the Worker, so it never sits in the page
source or in your repo.

## Using it

- Each of the five teams plays the same 25 tiles on their own board. Switch
  between them with the buttons at the top, or by tapping a row in
  **Standings**.
- Tap any tile for the full task and the admin controls.
- Sign in as admin, then **Open board editor** to rewrite all 50 tasks, the
  event title and all five team names. Save writes them live.
- **Download backup** gives you a JSON file of the whole board; **Load
  backup** restores it.
- Layer 2 text is visible to the admin at all times and to everyone else only
  once that tile's layer 1 is done — so keep the editor screen off-stream.

## Custom domain

Worker → **Settings → Domains & Routes → Add**. Any domain already on
Cloudflare gets attached in a minute or two.
