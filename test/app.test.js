const { test, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0); // puerto aleatorio libre
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('GET / devuelve la info de la app', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.app, 'devops-lab-openshift');
  assert.ok(body.version);
  assert.ok(body.pod);
});

test('GET /health devuelve UP', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(await res.json(), { status: 'UP' });
});

test('GET /ready devuelve 503 cuando la app no está lista', async () => {
  app.setReady(false);
  const res = await fetch(`${baseUrl}/ready`);
  assert.strictEqual(res.status, 503);
  app.setReady(true);
});
test('no expone la cabecera X-Powered-By', async () => {
	  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.headers.get('x-powered-by'), null);
});
