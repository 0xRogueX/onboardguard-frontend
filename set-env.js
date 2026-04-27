const fs = require('fs');
require('dotenv').config();

const config = {
  framework: "angular",
  outputDir: "src/app",
  mode: "auto",
  watch: true,
  mcpServers: {
    stitch: {
      serverUrl: "https://stitch.googleapis.com/mcp",
      headers: {
        "X-Goog-Api-Key": process.env.GCP_API_KEY
      }
    }
  }
};

fs.writeFileSync(
  './antigravity.config.json',
  JSON.stringify(config, null, 2)
);