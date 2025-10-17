Backend - Environment variables

Create a file `.env` in `backend/` with at least:

- PORT: HTTP server port (e.g. 3000)
- DB_HOST: MySQL host (e.g. localhost)
- DB_USER: MySQL user
- DB_PASS: MySQL password
- DB_NAME: MySQL database name

Optional variables:

- NODE_ENV: development | production (enables extra logs in development)
- PING_LOSS_THRESHOLD: Ping loss percentage threshold to decide up/down (default 10)
- IP_CACHE_MAX: Size of the in-memory IP→device cache (default 10000)
- RABBIT_QUEUE_PING: Queue name for ping results (default ping_results)
- RABBIT_QUEUE_TRAFFIC: Queue name for traffic results (default traffic_results)

Example `.env`:

PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=secret
DB_NAME=monitoring
NODE_ENV=development
PING_LOSS_THRESHOLD=10
IP_CACHE_MAX=10000
RABBIT_QUEUE_PING=ping_results
RABBIT_QUEUE_TRAFFIC=traffic_results

SCHEDULER_INTERVAL_MS=60000
SCHEDULER_PORTS_INTERVAL_MS=60000
SCHEDULER_BATCH_SIZE=300
