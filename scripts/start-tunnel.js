// scripts/start-tunnel.js
const { spawn } = require("child_process");

// Make tunnel optional for local dev. If PUBLIC_ORIGIN is not defined,
// simply skip starting ngrok instead of exiting with an error.
const origin = process.env.PUBLIC_ORIGIN;
if (!origin) {
  console.log("PUBLIC_ORIGIN not set. Skipping ngrok tunnel.");
  process.exit(0);
}

try {
  const url = new URL(origin);         // e.g. https://something.ngrok-free.dev
  const domain = url.hostname;         // domain host
  const port = url.port || "4300";     // fallback if no port in URL

  const args = ["http", port, `--domain=${domain}`];
  console.log(`Starting ngrok tunnel → ${origin}`);

  const p = spawn("ngrok", args, { stdio: "inherit", shell: true });
  p.on("exit", (code) => process.exit(code ?? 0));
} catch (err) {
  console.warn(`Invalid PUBLIC_ORIGIN (\"${origin}\"). Skipping ngrok.`, err?.message ?? err);
  process.exit(0);
}
