# svc-pedido

Microservico de Gestao de Pedidos do Continuous Testing Framework. TCC de Dorigao-LTDA.

## Stack

| Componente | Tecnologia |
|---|---|
| Linguagem | Java 25 |
| Framework | Spring Boot 3.5 |
| Build | Maven |
| Container | eclipse-temurin:25-jre-alpine |
| Observabilidade | OpenTelemetry (OTLP HTTP para alloy.observability.svc.cluster.local:4318) |
| Testes de carga | k6 |
| Testes de caos | Chaos Mesh |
| Deploy | Argo CD via GitOps |

## Endpoints da API

| Metodo | Path | Descricao |
|---|---|---|
| GET | `/api/pedido` | Listar todos os pedidos |
| GET | `/api/pedido/{id}` | Buscar pedido por UUID |
| POST | `/api/pedido` | Criar pedido |
| PATCH | `/api/pedido/{id}/status` | Atualizar status do pedido (query param: `status`) |

Campos do POST: `itens` (List de String), `cliente` (String).

### Health e metricas

| Path | Descricao |
|---|---|
| `/health` | Health check geral (Spring Actuator) |
| `/health/readiness` | Readiness probe |
| `/health/liveness` | Liveness probe |
| `/metrics` | Metricas Prometheus (Actuator) |

## Variaveis de ambiente

| Variavel | Default | Descricao |
|---|---|---|
| `SERVER_PORT` | `8080` | Porta HTTP |
| `OTEL_SERVICE_NAME` | `pedido` | Nome do servico no tracing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://alloy.observability.svc.cluster.local:4318` | Endpoint do coletor OTLP |
| `DEPLOY_ENV` | `development` | Ambiente de deploy |
| `LOG_LEVEL` | `INFO` | Nivel de log |
| `JAVA_OPTS` | (vazio) | Argumentos extras da JVM |

## Build e execucao

```bash
# Local
./mvnw spring-boot:run

# Docker
docker build -t svc-pedido .
docker run -p 8080:8080 svc-pedido

# Teste rapido
curl http://localhost:8080/api/pedido
curl -X POST http://localhost:8080/api/pedido \
  -H "Content-Type: application/json" \
  -d '{"itens":["produto-1","produto-2"],"cliente":"Joao Silva"}'
```

### Dockerfile

Multi-stage build: `maven:3.9-eclipse-temurin-25` no estagio de build, `eclipse-temurin:25-jre-alpine` no estagio de runtime. Usuario nao-root (`appuser`), ZGC como garbage collector, healthcheck a cada 15s contra `/health/readiness`, `STOPSIGNAL SIGTERM` para graceful shutdown.

## Pipeline CI/CD

O pipeline em `.github/workflows/pipeline.yml` executa 7 estagios sequenciais:

| Estagio | Descricao |
|---|---|
| 1. test | Build Maven, testes unitarios (JUnit 5), relatorio JaCoCo, SAST (OWASP Dependency Check, atualmente desabilitado) |
| 2. build-and-push | Azure Login via OIDC, Docker build, push para ACR, scan Trivy (HIGH, CRITICAL) |
| 3. deploy | Trigger Argo CD sync, aguarda rollout (timeout 300s) |
| 4. smoke-test | k6 smoke.js (1 VU, 1 min), validacao rapida pos-deploy |
| 5. performance-test | k6 baseline.js (10 VUs, 5 min) e stress.js (rampa ate 100 VUs, 10 min) |
| 6. resilience-test | Chaos Mesh (pod-kill, network-delay) com k6 smoke durante o caos |
| 7. gate-evaluation | Avalia resultados contra thresholds do nfr.yaml, exit 1 se falhar |

Gates condicionais: estagio 5 depende de `run_perf_tests`, estagio 6 depende de `run_chaos_tests`.

## Testes nao-funcionais

### Scripts k6 (diretorio `k6/`)

| Script | Cenario |
|---|---|
| `smoke.js` | Validacao rapida, 1 VU, 1 minuto |
| `baseline.js` | Carga constante, 10 VUs, 5 minutos |
| `stress.js` | Rampa progressiva, ate 100 VUs, 10 minutos |
| `spike.js` | Pico repentino, ate 200 VUs, 5 minutos |

### Experimentos Chaos Mesh (diretorio `chaos/`)

| Arquivo | Experimento |
|---|---|
| `pod-kill.yaml` | Mata um pod aleatorio a cada 5 minutos |
| `network-delay.yaml` | Injeta 100ms de latencia de rede por 2 minutos |
| `pod-cpu-stress.yaml` | Estressa CPU (80% load) por 60 segundos |

## Requisitos nao-funcionais

Definidos em `nfr.yaml`:

| Threshold | Valor | Tipo |
|---|---|---|
| `http_req_failed` | < 1% | Gate critico |
| `http_req_duration` p95 | < 300ms | Gate critico |
| `http_req_duration` p99 | < 800ms | Gate critico |
| `throughput` | >= 50 req/s | Warning |
| SLA disponibilidade | 99.5% | Contratual mensal |
| Recovery time target | 30s | Pos-caos |

## Deploy

O deploy usa o Helm chart generico (`service-chart`) do infra-platform. Os valores especificos do servico estao em `deploy/values.yaml`:

- `image.repository`: ACR com a imagem do servico
- `ingress.hosts`: `pedido.dorigao.dev.br`
- `resources`: requests e limites de CPU/memoria
- `podLabels`: labels usados pelo Chaos Mesh para selecao de pods
