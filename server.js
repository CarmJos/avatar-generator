const express = require("express");
const path = require("path");
const { createApiRouter, loadConfig } = require("./api");

const config = loadConfig(__dirname);

const app = express();

app.use("/api", createApiRouter({ baseDir: __dirname, config }));

const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = config.server.port || 8059;
app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("  Avatar Generator Server");
  console.log("  ========================");
  console.log(`  Server running on: http://localhost:${PORT}`);
  console.log(`  API endpoint:      http://localhost:${PORT}/api?seed=<email|md5>`);
  console.log(`  Health check:      http://localhost:${PORT}/api/health`);
  console.log(`  Base path (build): ${config.server.basePath || "/"}`);
  console.log(`  Gravatar mirror:   ${config.gravatar.mirrorUrl}`);
  console.log(`  Cache max-age:     ${config.cache.maxAge}s`);
  console.log(`  Mode:              static frontend + /api`);
  console.log("");
});
