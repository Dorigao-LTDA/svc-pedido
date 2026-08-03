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
