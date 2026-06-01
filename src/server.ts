import { createServer } from "node:http";
import { createApp, closeApp } from "./app.js";
import { loadConfig } from "./config/env.js";

const config = loadConfig();
const app = createApp(config);
const server = createServer(app);

server.listen(config.port, () => {
  console.log(`Movie API listening on http://localhost:${config.port}`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`${signal} received; shutting down Movie API`);
  server.close(() => {
    closeApp(app);
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
