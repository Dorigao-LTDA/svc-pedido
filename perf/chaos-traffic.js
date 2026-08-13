// Minimal traffic generator for chaos experiments — GET only, no writes.
// Keeps the service warm while chaos runs without polluting the database.
// Thresholds are deliberately loose: the chaos is expected to cause failures.
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    // chaos traffic always crosses these; evaluate-gates.py handles the real check
    http_req_failed: ['rate<1.0'],
    http_req_duration: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://pedido.app.svc.cluster.local:8080';

export default function () {
  http.get(`${BASE_URL}/health`);
  http.get(`${BASE_URL}/api/pedido`);
  sleep(1);
}

// handleSummary: writes aggregated summary JSON at test end (replaces --summary-export,
// removed in k6 v0.48+). --out json writes NDJSON incrementally and gets extracted too early.
export function handleSummary(data) {
  const summary = { metrics: {} };
  for (const [name, m] of Object.entries(data.metrics)) {
    if (m && m.values) summary.metrics[name] = { values: m.values };
  }
  const json = JSON.stringify(summary);
  const outFile = __ENV.K6_SUMMARY_FILE || '/output/summary.json';
  // ponytail: goja (k6 JS runtime) does not support ES6 computed property names
  // like { [outFile]: json }. Use explicit assignment instead.
  const result = { stdout: json };
  result[outFile] = json;
  return result;
}
