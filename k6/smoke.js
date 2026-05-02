// Smoke test — validação rápida pós-deploy
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://pedido.app.svc.cluster.local:8080';

export default function () {
  // Health check
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health OK': (r) => r.status === 200 });

  // Listar produtos
  const list = http.get(`${BASE_URL}/api/pedido`);
  check(list, {
    'list status 200': (r) => r.status === 200,
    'list has items': (r) => {
      try { return JSON.parse(r.body).length > 0; } catch { return false; }
    },
  });

  // Criar produto
  const create = http.post(`${BASE_URL}/api/pedido`, JSON.stringify({
    nome: 'Smoke Test Product',
    descricao: 'Created during smoke test',
    preco: 9.99,
    categoria: 'test',
    quantidadeEstoque: 1,
  }), { headers: { 'Content-Type': 'application/json' } });
  check(create, { 'create status 201': (r) => r.status === 201 });
}
