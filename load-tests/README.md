# Load Tests (k6)

Tests de carga para la API de EPDE usando [k6](https://k6.io/).

## Prerequisitos

```bash
# macOS
brew install k6

# Docker (alternativa)
docker pull grafana/k6
```

## Scripts disponibles

| Script             | Descripcion                                                                      | VUs   | Duracion |
| ------------------ | -------------------------------------------------------------------------------- | ----- | -------- |
| `auth-flow.js`     | Login → refresh → logout completo                                                | 20→50 | ~2.5min  |
| `api-endpoints.js` | CRUD endpoints principales (dashboard, properties, notifications, budgets, etc.) | 20→50 | ~2.5min  |

## Ejecucion

### Contra staging

```bash
k6 run --env BASE_URL=https://staging-api.epde.com.ar/api/v1 load-tests/auth-flow.js
k6 run --env BASE_URL=https://staging-api.epde.com.ar/api/v1 load-tests/api-endpoints.js
```

### Contra local

```bash
k6 run --env BASE_URL=http://localhost:3001/api/v1 load-tests/auth-flow.js
k6 run --env BASE_URL=http://localhost:3001/api/v1 load-tests/api-endpoints.js
```

### Con Docker

```bash
docker run --rm -i --network host grafana/k6 run - < load-tests/auth-flow.js
```

## Datos de prueba

Los tests esperan usuarios de carga con el formato:

- Email: `loadtest+{VU_NUMBER}@epde.com.ar`
- Password: `LoadTest123!`

Crear estos usuarios en la base de datos de staging antes de ejecutar los tests. Se recomienda crear al menos 50 usuarios (uno por VU maximo).

## Thresholds

Ambos scripts validan:

| Metrica                   | Threshold |
| ------------------------- | --------- |
| `http_req_duration` (p95) | < 500ms   |
| `failures` (rate)         | < 1%      |
| `login_duration` (p95)    | < 1000ms  |
| `refresh_duration` (p95)  | < 300ms   |

Si alguna metrica excede su threshold, k6 retorna exit code != 0.

## Output a Grafana (opcional)

```bash
k6 run --out influxdb=http://localhost:8086/k6 load-tests/auth-flow.js
```
