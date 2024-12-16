const express = require("express");
const config = require("./config");
const app = express();
const port = config.port || 30; // Use config.port or fallback to 30

app.get("/", (req, res) => {
  res.send("Hello World!");
});

try {
  app.listen(port, () => {
    console.log(`[✅] Server running at http://localhost:${port}`);
  });
} catch (error) {
  console.error(`[❌] Failed to start the server: ${error.message}`);
}
