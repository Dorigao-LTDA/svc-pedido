// Spike test — pico repentino de tráfego
// Scenario stages and thresholds from __ENV (nfr.yaml via nfr-to-env.py)
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://pedido.app.svc.cluster.local:8080';
const errors = new Rate('pedido_errors');

function parseStages(envStr) {
  if (!envStr) return [
    { duration: '1m', target: 25 },
    { duration: '30s', target: 200 },
    { duration: '2m', target: 200 },
    { duration: '1m30s', target: 0 },
  ];
  try { return JSON.parse(envStr); } catch { return []; }
}

const THRESHOLD_FAILED = parseFloat(__ENV.K6_SPIKE_THRESHOLD_HTTP_REQ_FAILED_RATE || 0.10);
const THRESHOLD_P99 = parseInt(__ENV.K6_SPIKE_THRESHOLD_HTTP_REQ_DURATION_P99 || 3000);

export const options = {
  thresholds: {
    http_req_failed: [`rate<${THRESHOLD_FAILED}`],
    http_req_duration: [`p(99)<${THRESHOLD_P99}`],
  },
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: parseStages(__ENV.K6_SPIKE_STAGES),
      gracefulStop: '30s',
    },
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/pedido`, { tags: { operation: 'list' } });
  check(res, {
    'GET list 200': (r) => r.status === 200,
  }) || errors.add(1);

  sleep(0.1 + Math.random() * 1);
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
