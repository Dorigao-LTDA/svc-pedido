// Stress test — rampa progressiva para encontrar ponto de quebra
// Scenario stages and thresholds from __ENV (nfr.yaml via nfr-to-env.py)
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://pedido.app.svc.cluster.local:8080';
const errors = new Rate('pedido_errors');

function parseStages(envStr) {
  if (!envStr) return [
    { duration: '2m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '3m', target: 150 },
    { duration: '2m', target: 0 },
  ];
  try { return JSON.parse(envStr); } catch { return []; }
}

const THRESHOLD_FAILED = parseFloat(__ENV.K6_STRESS_THRESHOLD_HTTP_REQ_FAILED_RATE || 0.05);
const THRESHOLD_P99 = parseInt(__ENV.K6_STRESS_THRESHOLD_HTTP_REQ_DURATION_P99 || 2000);

export const options = {
  thresholds: {
    http_req_failed: [`rate<${THRESHOLD_FAILED}`],
    http_req_duration: [`p(99)<${THRESHOLD_P99}`],
  },
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: parseStages(__ENV.K6_STRESS_STAGES),
      gracefulStop: '30s',
    },
  },
};

export default function () {
  const listRes = http.get(`${BASE_URL}/api/pedido`, { tags: { operation: 'list' } });
  check(listRes, {
    'GET list 200': (r) => r.status === 200,
  }) || errors.add(1);

  sleep(0.5 + Math.random() * 2);
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
  return { stdout: json, [outFile]: json };
}
