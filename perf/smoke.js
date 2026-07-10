// Smoke test — validação rápida pós-deploy
// Thresholds and scenario params from __ENV (nfr.yaml via nfr-to-env.py)
import http from 'k6/http';
import { check } from 'k6';

const VUS = __ENV.K6_SMOKE_VUS ? parseInt(__ENV.K6_SMOKE_VUS) : 1;
const DURATION = __ENV.K6_SMOKE_DURATION || '1m';
const THRESHOLD_FAILED = parseFloat(__ENV.K6_SMOKE_THRESHOLD_HTTP_REQ_FAILED || 0.05);
const THRESHOLD_P95 = parseInt(__ENV.K6_SMOKE_THRESHOLD_P95 || 1000);

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_failed: [`rate<${THRESHOLD_FAILED}`],
    http_req_duration: [`p(95)<${THRESHOLD_P95}`],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://pedido.app.svc.cluster.local:8080';

export default function () {
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health OK': (r) => r.status === 200 });

  const list = http.get(`${BASE_URL}/api/pedido`);
  check(list, {
    'list status 200': (r) => r.status === 200,
    'list has items': (r) => {
      try { return JSON.parse(r.body).length > 0; } catch { return false; }
    },
  });

  const create = http.post(`${BASE_URL}/api/pedido`, JSON.stringify({
    itens: ['Item de Teste Smoke'],
    cliente: 'Smoke Test Client',
  }), { headers: { 'Content-Type': 'application/json' } });
  check(create, { 'create status 201': (r) => r.status === 201 });
}
