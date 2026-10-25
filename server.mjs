import { createServer } from "node:http";
import { readFile, writeFile, mkdir, copyFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const dataDir = join(root, "data");
const backupDir = join(dataDir, "backups");
const stateFile = join(dataDir, "state.json");
const port = Number(process.env.PORT || 4312);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

await mkdir(backupDir, { recursive: true });

async function readState() {
  if (!existsSync(stateFile)) return null;
  return JSON.parse(await readFile(stateFile, "utf8"));
}

async function persistState(state) {
  if (!state || typeof state !== "object" || !Array.isArray(state.tasks)) {
    throw new Error("Invalid learning state");
  }
  state.meta = { ...(state.meta || {}), savedAt: new Date().toISOString() };
  await writeFile(stateFile, JSON.stringify(state, null, 2), "utf8");
  return state;
}

async function createBackup() {
  if (!existsSync(stateFile)) return null;
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const target = join(backupDir, `state-${stamp}.json`);
  await copyFile(stateFile, target);
  const backups = (await readdir(backupDir)).filter(name => name.endsWith(".json")).sort().reverse();
  return { name: target.split(/[\\/]/).at(-1), count: backups.length };
}

function send(res, status, body, contentType = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType, "Cache-Control": "no-store" });
  if (typeof body === "string" || Buffer.isBuffer(body)) return res.end(body);
  res.end(JSON.stringify(body));
}

async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/api/state" && req.method === "GET") {
      return send(res, 200, { state: await readState() });
    }
    if (url.pathname === "/api/state" && req.method === "PUT") {
      return send(res, 200, { state: await persistState(await body(req)) });
    }
    if (url.pathname === "/api/backup" && req.method === "POST") {
      return send(res, 200, { backup: await createBackup() });
    }
    if (url.pathname === "/api/export" && req.method === "GET") {
      const state = await readState();
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": "attachment; filename=eeg-learning-backup.json"
      });
      return res.end(JSON.stringify(state, null, 2));
    }

    if (url.pathname === "/favicon.ico") return send(res, 204, "", "image/x-icon");
    const relative = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const target = resolve(publicDir, relative);
    if (!target.startsWith(resolve(publicDir))) return send(res, 403, "Forbidden", "text/plain");
    const file = await readFile(target);
    return send(res, 200, file, types[extname(target)] || "application/octet-stream");
  } catch (error) {
    if (error.code === "ENOENT") return send(res, 404, "Not found", "text/plain; charset=utf-8");
    console.error(error);
    return send(res, 500, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`EEG learning system: http://127.0.0.1:${port}`);
});
