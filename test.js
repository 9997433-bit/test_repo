const { test } = require("node:test");
const assert = require("node:assert");
const { greet, createApp } = require("./app");

test("greet uses the provided name", () => {
  assert.strictEqual(greet("Cursor"), "Hello, Cursor!");
});

test("greet falls back to World when name is missing", () => {
  assert.strictEqual(greet(), "Hello, World!");
  assert.strictEqual(greet("   "), "Hello, World!");
});

test("GET /api/greet returns a JSON greeting", async () => {
  const server = createApp().listen(0);
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/greet?name=Cursor`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.deepStrictEqual(body, { message: "Hello, Cursor!" });
  } finally {
    server.close();
  }
});

test("GET /healthz reports ok", async () => {
  const server = createApp().listen(0);
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/healthz`);
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(await res.json(), { status: "ok" });
  } finally {
    server.close();
  }
});
