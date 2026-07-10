// Stress test — rampa progressiva para encontrar ponto de quebra
// Scenario stages and thresholds from __ENV (nfr.yaml via nfr-to-env.py)
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://pedido.app.svc.cluster.local:8080';
const errors = new Rate('pedido_errors');

function parseStages(envStr) {
  if (!envStr) return [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 10 },
    { duration: '1m', target: 100 },
  ];
  try { return JSON.parse(envStr); } catch { return []; }
}

const THRESHOLD_FAILED = parseFloat(__ENV.K6_STRESS_THRESHOLD_HTTP_REQ_FAILED || 0.05);
const THRESHOLD_P99 = parseInt(__ENV.K6_STRESS_THRESHOLD_P99 || 2000);

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
