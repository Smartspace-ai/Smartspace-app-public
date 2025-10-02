// scripts/start-tunnel.js
const { spawn } = require("child_process");

const origin = process.env.PUBLIC_ORIGIN;
if (!origin) {
  console.error("PUBLIC_ORIGIN not set in .env");
  process.exit(1);
}

const url = new URL(origin);         // e.g. https://melanie...ngrok-free.dev
const domain = url.hostname;         // melanie-chaster-cheerlessly.ngrok-free.dev
const port = url.port || "4300";     // fallback if no port in URL

const args = ["http", port, `--domain=${domain}`];
console.log(`Starting ngrok tunnel → ${origin}`);

const p = spawn("ngrok", args, { stdio: "inherit", shell: true });
p.on("exit", (code) => process.exit(code ?? 0));
