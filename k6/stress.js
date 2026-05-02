// Stress test — rampa progressiva para encontrar ponto de quebra
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://pedido.app.svc.cluster.local:8080';
const errors = new Rate('pedido_errors');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.05'],  // Mais tolerante em stress
    http_req_duration: ['p(99)<2000'],
  },
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 10 },
        { duration: '1m', target: 100 },
      ],
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
