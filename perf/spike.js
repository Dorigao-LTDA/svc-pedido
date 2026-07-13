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

const THRESHOLD_FAILED = parseFloat(__ENV.K6_SPIKE_THRESHOLD_HTTP_REQ_FAILED || 0.10);
const THRESHOLD_P99 = parseInt(__ENV.K6_SPIKE_THRESHOLD_P99 || 3000);

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
