import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { apiRouter } from './api';

const app = express();
app.use('/api', apiRouter);

// Test helper for Express handler
function testRequest(path: string, options: { method?: string; body?: any; headers?: any } = {}) {
  return new Promise<{ status: number; body: any; headers: any }>((resolve) => {
    const method = options.method || 'GET';
    const req: any = {
      method,
      url: `/api${path}`,
      headers: options.headers || {},
      query: {},
      params: {},
      body: options.body || {},
    };

    // parse query if any
    const [pathPart, queryPart] = path.split('?');
    if (queryPart) {
      req.url = `/api${pathPart}`;
      const params = new URLSearchParams(queryPart);
      params.forEach((v, k) => {
        req.query[k] = v;
      });
    }

    let status = 200;
    const resHeaders: any = {};
    let responseData: any = '';

    const res: any = {
      setHeader: (k: string, v: string) => {
        resHeaders[k.toLowerCase()] = v;
      },
      status: (s: number) => {
        status = s;
        return res;
      },
      json: (d: any) => {
        responseData = d;
        resolve({ status, body: responseData, headers: resHeaders });
      },
      send: (d: any) => {
        responseData = d;
        resolve({ status, body: responseData, headers: resHeaders });
      },
    };

    app(req, res, () => {
      resolve({ status: 404, body: { error: 'Not found' }, headers: resHeaders });
    });
  });
}

test('GET /api/courses returns courses catalog', async () => {
  const res = await testRequest('/courses');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 5);
});

test('POST /api/telegram/interact executes bot command', async () => {
  const res = await testRequest('/telegram/interact', {
    method: 'POST',
    body: {
      botId: 'bot-owner',
      chatId: 1029384,
      fromName: 'Shanto',
      text: '/start',
      lang: 'bn',
    },
  });

  assert.equal(res.status, 200);
  assert.match(res.body.text, /স্বাগতম/);
  assert.ok(res.body.buttons.length >= 2);
});

test('GET /api/reports/export-csv returns valid CSV format', async () => {
  const res = await testRequest('/reports/export-csv?type=orders');
  assert.equal(res.status, 200);
  assert.match(res.body, /OrderNumber,Date,Course,Customer/);
});
