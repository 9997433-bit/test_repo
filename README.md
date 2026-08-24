# test_repo

A minimal Node.js web app used to validate the Cloud Agent development environment.

## Requirements

- Node.js >= 18 (developed against Node 22)

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

The server listens on `http://localhost:3000` (override with the `PORT` env var).

Endpoints:

- `GET /` — HTML landing page with a greeting.
- `GET /api/greet?name=<name>` — JSON greeting, e.g. `{ "message": "Hello, Cursor!" }`.
- `GET /healthz` — health check, returns `{ "status": "ok" }`.

## Test

```bash
npm test
```

Runs the built-in Node.js test runner against `test.js`.
