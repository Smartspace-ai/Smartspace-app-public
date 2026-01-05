// scripts/start-tunnel.js
const { spawn } = require("child_process");

// Make tunneling optional for local dev. If PUBLIC_ORIGIN is not defined,
// simply skip starting a tunnel instead of exiting with an error.
const origin = process.env.PUBLIC_ORIGIN;
const tunnelId = String(process.env.TUNNEL_ID || "").trim();
if (!origin) {
  console.log("PUBLIC_ORIGIN not set. Skipping dev tunnel.");
  process.exit(0);
}

// If true, tunnel failures should fail the whole command (useful in CI or strict dev envs).
// Default: false (best-effort tunnel).
const tunnelRequired = String(process.env.TUNNEL_REQUIRED || "").toLowerCase() === "true";

try {
  // PUBLIC_ORIGIN is informational here (used by Vite host allow-list and by humans).
  // Dev Tunnels will still expose the local port; the hosted URL is determined by Dev Tunnels.
  const url = new URL(origin);         // e.g. https://<something>.devtunnels.ms
  const host = url.hostname;
  const port = process.env.TUNNEL_PORT || url.port || "4300"; // default to Vite dev server port

  // VS Code / Microsoft Dev Tunnels CLI (installed by the "Dev Tunnels" tooling).
  // Typical usage: devtunnel host -p 4300 --allow-anonymous
  // To reuse a stable URL, provide an existing tunnel id as the first argument: devtunnel host <tunnel-id> --allow-anonymous
  // Note: when using an existing tunnel id, passing "-p/--port-numbers" can cause the service to reject a "batch update of ports".
  // In that case, create/update ports separately (devtunnel port create/update) and host without "-p".
  // If this fails, set TUNNEL_REQUIRED=true to fail fast, otherwise we continue without a tunnel.
  const args = ["host"];
  if (tunnelId) args.push(tunnelId);
  if (!tunnelId) args.push("-p", String(port));
  args.push("--allow-anonymous");
  console.log(`Starting dev tunnel for :${port} (expected public origin host: ${host})`);
  if (tunnelId) console.log(`Reusing dev tunnel id: ${tunnelId}`);

  const p = spawn("devtunnel", args, { stdio: "inherit", shell: true });
  p.on("exit", (code) => {
    if (!tunnelRequired && code && code !== 0) {
      console.warn(
        `devtunnel exited with code ${code}. Continuing without tunnel (set TUNNEL_REQUIRED=true to fail).`
      );
      process.exit(0);
    }
    process.exit(code ?? 0);
  });
} catch (err) {
  console.warn(`Invalid PUBLIC_ORIGIN ("${origin}"). Skipping dev tunnel.`, err?.message ?? err);
  process.exit(0);
}


