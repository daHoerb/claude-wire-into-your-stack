---
name: express-route
description: Conventions for adding or changing an HTTP endpoint in this Express API (routes/*.js). Use when the user asks to add, create, change, or extend an endpoint, route, or resource (e.g. "add a DELETE /users/:id", "add a /products resource", "add an endpoint that..."). Not for unrelated edits, tests-only changes, or config work.
---

# Writing a route in this API

Follow these steps every time an endpoint is added or changed.

## 1. Router: one file per resource
- Existing resource → add the handler to `routes/<resource>.js`.
- New resource → create `routes/<resource>.js` exporting an `express.Router()`, and mount it in `server.js`: `app.use('/<resource>', <resource>Router);`
- Put a one-line comment above each handler: `// METHOD /path — what it does.`

## 2. Data only through `db/store.js`
- Routes never keep state (no module-level arrays or counters in `routes/`).
- If a store function is missing (e.g. `deleteUser`), add it to `db/store.js`, export it, and keep `reset()` working for the tests.

## 3. Validate, then respond
- Parse ids with `Number(req.params.id)`.
- Bad or missing input → `400` with `{ "error": "<what is wrong>" }`.
- Record not found → `404` with `{ "error": "<Thing> not found" }`.
- Success: `200` with the record, `201` with the created record, `204` with no body for deletes.
- Every error body has exactly the shape `{ "error": "message" }`.

```js
// DELETE /users/:id — remove a user, or 404 if it doesn't exist.
router.delete('/:id', (req, res) => {
  const removed = store.deleteUser(Number(req.params.id));
  if (!removed) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.status(204).end();
});
```

## 4. Test it
In `tests/<resource>.test.js` (node:test + supertest), call `store.reset()` in `beforeEach`, and cover the happy path plus each `400` and `404` branch.

## 5. Document it
Add or update the endpoint in `docs/api.md` (method, path, body, status codes).

## 6. Verify
Run `npm test` and `npm run lint` and make sure both pass.
