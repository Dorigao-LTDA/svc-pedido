// Spike test — pico repentino de tráfego
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://pedido.app.svc.cluster.local:8080';
const errors = new Rate('pedido_errors');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.10'],  // Mais tolerante em spike
    http_req_duration: ['p(99)<3000'],
  },
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '30s', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '1m30s', target: 10 },
      ],
      gracefulStop: '30s',
    },
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/pedido`, { tags: { operation: 'list' } });
  check(res, {
    'GET list 200': (r) => r.status === 200,
  }) || errors.add(1);

  sleep(0.1 + Math.random() * 1); // Menos sleep = mais agressivo
}
