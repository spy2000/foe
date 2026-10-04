/**
 * Keep-Alive Health Ping Script
 * Pings the /api/health endpoint every 5 minutes to prevent free-tier instances (Render + Neon Postgres) from idling.
 *
 * Usage:
 *   node scripts/ping-health.js
 * Or set API_URL=https://your-api.onrender.com/api/health
 */

const https = require("https");
const http = require("http");

const TARGET_URL = process.env.API_URL || "http://localhost:5000/api/health";
const INTERVAL_MS = parseInt(process.env.PING_INTERVAL_MS || "300000", 10); // 5 minutes default

function ping() {
  const client = TARGET_URL.startsWith("https") ? https : http;
  const startTime = Date.now();

  const req = client.get(TARGET_URL, (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      const duration = Date.now() - startTime;
      console.log(
        `[${new Date().toISOString()}] Pinged ${TARGET_URL} - Status: ${res.statusCode} (${duration}ms)`
      );
      try {
        const json = JSON.parse(body);
        console.log(`Database: ${json.database}, Uptime: ${json.uptime}s`);
      } catch {
        // ignore non-json
      }
    });
  });

  req.on("error", (err) => {
    console.error(`[${new Date().toISOString()}] Ping failed:`, err.message);
  });

  req.end();
}

console.log(`Starting Keep-Alive ping service targeting: ${TARGET_URL}`);
console.log(`Interval: ${INTERVAL_MS / 1000}s`);

// Immediate ping then repeat
ping();
setInterval(ping, INTERVAL_MS);
