# svc-pedido

Microserviço de Catálogo de Produtos — Continuous Testing Platform.

## Stack

- **Runtime**: Java 25 + Spring Boot 3.5
- **Build**: Maven
- **Observabilidade**: OpenTelemetry (OTLP → Alloy → Loki/Mimir/Tempo)
- **Testes**: JUnit 5 + k6 + Chaos Mesh
- **Deploy**: ArgoCD via GitOps

## API Endpoints

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| GET | `/health/readiness` | Readiness probe |
| GET | `/health/liveness` | Liveness probe |
| GET | `/metrics` | Métricas Prometheus |
| GET | `/api/pedido` | Listar produtos |
| GET | `/api/pedido?categoria=X` | Filtrar por categoria |
| GET | `/api/pedido/{id}` | Buscar por ID |
| POST | `/api/pedido` | Criar produto |
| PUT | `/api/pedido/{id}` | Atualizar produto |
| DELETE | `/api/pedido/{id}` | Remover produto |

## Variáveis de Ambiente

| Variável | Default | Descrição |
|----------|---------|-----------|
| `SERVER_PORT` | `8080` | Porta HTTP |
| `OTEL_SERVICE_NAME` | `pedido` | Nome no tracing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `alloy.observability.svc:4318` | Coletor OTLP |
| `DEPLOY_ENV` | `development` | Ambiente |
| `LOG_LEVEL` | `INFO` | Nível de log |
| `JAVA_OPTS` | — | JVM args extras |

## Pipeline CI/CD

```
Push → Build → Unit Test → SAST → Docker Build → Push ACR → Deploy → Smoke → Perf → Resilience → Gate
```

## Testes Não-Funcionais

- **Performance**: k6 (smoke, baseline, stress, spike)
- **Resiliência**: Chaos Mesh (pod kill, network delay, CPU stress)
- **Thresholds**: Ver `nfr.yaml`

## Requisitos Não-Funcionais

Ver [`nfr.yaml`](./nfr.yaml):
- `http_req_failed < 1%`
- `http_req_duration p95 < 300ms`
- `throughput ≥ 50 req/s`
- SLA: 99.5% availability

## Build & Run

```bash
# Local
./mvnw spring-boot:run

# Docker
docker build -t svc-pedido .
docker run -p 8080:8080 svc-pedido

# Test
curl http://localhost:8080/api/pedido
```
