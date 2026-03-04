# API Rate Limiting Microservice

## Overview
This is a dedicated, high-performance microservice to enforce API rate limits. It acts as a gatekeeper, enforcing limits based on client identifiers and specific endpoints using the Token Bucket algorithm. It's built with Node.js, Express, MongoDB (for client configurations), and Redis (for fast, atomic rate-limiting state in a distributed environment).

## Features
*   **Token Bucket Algorithm**: Smoothly handles bursts of requests while ensuring a strict average limit.
*   **Decentralized Rate Limiting State**: Leverages Redis executing atomic Lua scripts to maintain limit bounds precisely, even across scaled application instances.
*   **Containerized**: Built with multi-stage Docker builds resulting in a small surface area image.
*   **Configurable Limits**: Default limits can be adjusted through environment variables, and client-specific limits can be configured and stored in MongoDB.
*   **CI/CD Ready**: Configured with a robust GitHub Actions workflow for building, testing, and preparing for deployment.

## Architecture Highlights
See [ARCHITECTURE.md](./ARCHITECTURE.md) for rationale around the choice of algorithm and storage mechanism.

## Getting Started

### Prerequisites
*   [Docker](https://docs.docker.com/get-docker/) installed locally
*   [Docker Compose](https://docs.docker.com/compose/install/)

### Local Setup
The setup uses `docker-compose` to spin up the API application, MongoDB, and Redis without requiring any manual installation of these services on your system.

1.  **Clone the repository.**
2.  (Optional) Copy the `.env.example` to `.env` if you want to modify default settings:
    ```bash
    cp .env.example .env
    ```
3.  **Deploy everything with one command:**
    ```bash
    docker-compose up --build
    ```
    This will start the application on `http://localhost:3000`. The script `init-db.js` will automatically seed the `ratelimitdb` MongoDB database with three test clients!

### Testing
To run the automated test suite, ensure your containers are running, then execute:

**Unit Tests**: Asserts correctness of the core rate checking algorithm in complete isolation.
```bash
docker-compose exec app npm run test:unit
```

**Integration Tests**: Validates the end-to-end functionality via API requests while interacting with Redis and MongoDB.
```bash
docker-compose exec app npm run test:integration
```

## API Documentation

### 1. Healthcheck
*   **Endpoint:** `GET /health`
*   **Description:** Base health check.
*   **Response:** `200 OK` ("OK")

### 2. Register Client
*   **Endpoint:** `POST /api/v1/clients`
*   **Description:** Registers a new API client with custom or default rate-limit settings. The `apiKey` is securely hashed using bcrypt prior to database insertion.
*   **Request Body**:
    ```json
    {
      "clientId": "new-client",
      "apiKey": "super_secret_key",
      "maxRequests": 200,    // Optional, defaults to env DEFAULT_RATE_LIMIT_MAX_REQUESTS
      "windowSeconds": 120   // Optional, defaults to env DEFAULT_RATE_LIMIT_WINDOW_SECONDS
    }
    ```
*   **Example Response (201 Created)**:
    ```json
    {
      "clientId": "new-client",
      "maxRequests": 200,
      "windowSeconds": 120
    }
    ```

### 3. Check Rate Limit
*   **Endpoint:** `POST /api/v1/ratelimit/check`
*   **Description:** Verifies if an incoming request from a registered client on a specific path should proceed.
*   **Request Body**:
    ```json
    {
        "clientId": "test-client-1",
        "path": "/api/target-resource"
    }
    ```
*   **Example Response (200 OK - Allowed)**:
    ```json
    {
        "allowed": true,
        "remainingRequests": 9,
        "resetTime": "2023-11-20T10:00:00.000Z"
    }
    ```
*   **Example Response (429 Too Many Requests - Not Allowed)**:
    ```json
    {
        "allowed": false,
        "retryAfter": 6,
        "resetTime": "2023-11-20T10:00:06.000Z"
    }
    ```
    *(HTTP Header `Retry-After: 6` is also included).*

## Evaluation Environment Details
*   `DEFAULT_RATE_LIMIT_MAX_REQUESTS` and `DEFAULT_RATE_LIMIT_WINDOW_SECONDS` can be found in `.env.example`.
*   All endpoints validate schema usage securely with HTTP 400 Bad Request if missing fields.
