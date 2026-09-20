// Cloudflare Worker: serves the static site from ./public and handles the
// two API routes the board needs. Requires a KV binding named BINGO and an
// ADMIN_PASSWORD secret, both set under the Worker's Settings in the
// Cloudflare dashboard.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handleGetState(env) {
  if (!env.BINGO) return json({ error: "KV namespace BINGO is not bound" }, 500);
  const raw = await env.BINGO.get("state");
  return json({ state: raw ? JSON.parse(raw) : null });
}

async function handlePostState(request, env) {
  if (!env.BINGO) return json({ error: "KV namespace BINGO is not bound" }, 500);

  const key = request.headers.get("x-admin-key") || "";
  if (!env.ADMIN_PASSWORD || key !== env.ADMIN_PASSWORD) {
    return json({ error: "Wrong password" }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }

  if (!body || !Array.isArray(body.tasks) || !Array.isArray(body.progress)) {
    return json({ error: "That doesn't look like a board" }, 400);
  }

  await env.BINGO.put("state", JSON.stringify(body));
  return json({ ok: true });
}

async function handleAuth(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const ok = Boolean(env.ADMIN_PASSWORD) && body.password === env.ADMIN_PASSWORD;
  return json({ ok });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/state") {
      if (request.method === "GET") return handleGetState(env);
      if (request.method === "POST") return handlePostState(request, env);
      return json({ error: "Method not allowed" }, 405);
    }

    if (url.pathname === "/api/auth") {
      if (request.method === "POST") return handleAuth(request, env);
      return json({ error: "Method not allowed" }, 405);
    }

    // Everything else: serve the static site.
    return env.ASSETS.fetch(request);
  },
};
