# Architecture Choices & Rationale

## Core Algorithm: Token Bucket
For this API Rate Limiting Microservice, the **Token Bucket** algorithm was selected over Leaky Bucket and other alternatives (such as Fixed Window or Sliding Window).

### Why Token Bucket?
1.  **Handles Bursts Intelligently**: Real-world API traffic is rarely smooth; it arrives in bursts. Token Bucket intrinsically supports burstiness up to the bucket's capacity `maxRequests`. By contrast, strict Leaky Bucket implementations artificially restrict the outflow processing rate, which can lead to high latency spikes or false positives under sudden genuine traffic spikes.
2.  **Memory Efficient**: Only two data points need to be constantly maintained in state (per client per path combination):
    *   `tokens` (number of available tokens currently)
    *   `last_refill` (the exact timestamp the tokens were last updated)
3.  **Low Latency Computations**: Calculating the newly added tokens when checking a request is limited to a single sub-millisecond calculation `((now - last_refill) * refill_rate)`. It completely avoids iterating over arrays or maintaining huge lists of individual timestamps that sliding log rate limiters must combat.

## Data Storage Strategy
Because this state represents transient capability configurations (unlike permanent client user records), it has drastically different durability and speed requirements. 

### MongoDB (Configuration Data)
*   **Purpose**: Storing registered client APIs (`clientId`), hashed secrets (`hashedApiKey`), and their individual bounds limit configs. 
*   **Rationale**: Config data operates on extremely low write frequency but high read frequency. Relational limits scale well utilizing standard indexes in Mongo for the `clientId`. It serves as a persistent reliable ground-truth.

### Redis (Volatile State Management)
*   **Purpose**: In-memory caching for calculating token depletion.
*   **Rationale**: Speed and atomicity. Redis is ideal for scenarios where reads and writes must be resolved in milliseconds to ensure minimal latency overhead against the microservice being proxied.

### Race Condition Mitigation using LUA
In a distributed environment where multiple rate limiter microservice instances query the same volatile state, race conditions can corrupt limits. E.g., multiple concurrent checks might falsely observe `tokens = 1` and subtract `1`, dropping the value to negatives, and permitting more checks than authorized. 
To guarantee atomicity and thread-safety, the logic calculating the elapsed time, replenishing the tokens, and decreasing the token count runs as a **single executed Lua Script (`EVAL`)** within Redis. Redis executes Lua scripts synchronously, intrinsically locking the keys against parallel updates until completion, providing absolute thread and instance safety.
