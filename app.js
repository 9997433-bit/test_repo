const express = require("express");

function greet(name) {
  const trimmed = (name ?? "").toString().trim();
  const who = trimmed.length > 0 ? trimmed : "World";
  return `Hello, ${who}!`;
}

function createApp() {
  const app = express();

  app.get("/", (req, res) => {
    res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>test_repo</title>
    <style>
      body {
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        display: flex;
        min-height: 100vh;
        margin: 0;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1e3a8a, #6d28d9);
        color: #fff;
      }
      .card {
        background: rgba(255, 255, 255, 0.1);
        padding: 2.5rem 3rem;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
        text-align: center;
        backdrop-filter: blur(6px);
      }
      h1 { margin: 0 0 0.5rem; font-size: 2rem; }
      p { margin: 0; opacity: 0.9; }
      code { background: rgba(0,0,0,0.25); padding: 0.15rem 0.4rem; border-radius: 6px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${greet(req.query.name)}</h1>
      <p>Cloud Agent environment is running. Try <code>/api/greet?name=Cursor</code>.</p>
    </div>
  </body>
</html>`);
  });

  app.get("/api/greet", (req, res) => {
    res.json({ message: greet(req.query.name) });
  });

  app.get("/healthz", (req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}

module.exports = { createApp, greet };
