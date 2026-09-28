# FinGuard Phase 6: Redis & Real-Time Systems

## 1. Overview
In Phase 6 of the FinGuard roadmap, we established the real-time communications and caching layer. FinGuard uses **Socket.IO** for live, bidirectional event distribution and **Redis** for high-speed caching and Pub/Sub event forwarding.

To ensure seamless distribution for the final Windows desktop installer (`FinGuard-Setup.exe` in Phases 8 & 10), the Redis module implements a **resilient in-memory fallback adapter**. If an external Redis instance is unavailable or offline on the end-user's desktop, the server gracefully activates its in-memory cache and event emitter without crashing or requiring manual background service setup.

---

## 2. Architecture & Event Flow

```
+-------------------------------------------------------------+
|                      React UI / Electron                    |
|             (Phase 7: Socket.IO Client / State)             |
+------------------------------+------------------------------+
                               ^  (WebSockets / JWT Auth)
                               |
                               v
+-------------------------------------------------------------+
|                   FinGuard Express + Socket.IO              |
|                                                             |
|   +-----------------------------------------------------+   |
|   |         JWT Handshake Authentication Middleware     |   |
|   +-----------------------------------------------------+   |
|   |   User Private Rooms: `user:${userId}`              |   |
|   |   Fraud Monitoring Channel: `fraud:monitoring`      |   |
|   +-----------------------------------------------------+   |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|              Redis & Resilient In-Memory Manager            |
|                                                             |
|   * Cache: `wallet:${userId}` (60s TTL, auto-invalidation)  |
|   * Pub/Sub: `finguard:realtime_events` channel             |
|   * Fallback: Transparent in-memory cache & event emitter   |
+-------------------------------------------------------------+
```

---

## 3. Redis Caching & Pub/Sub (`server/src/lib/redis.js`)

### Resilient Architecture
- **Standard Redis Target**: Connects via `ioredis` to `process.env.REDIS_URL` or default `redis://127.0.0.1:6379`.
- **Desktop Fallback**: Uses a non-blocking timeout connection attempt. If no local Redis daemon is running, it logs an informative notice and transparently activates an in-memory TTL cache and event emitter.
- **Status Inspection**: Exposes `/api/realtime/status` to inspect current driver (`ioredis` vs `in-memory-adapter`).

### Caching Strategy
1. **Wallet Balance Cache (`wallet:${userId}`)**:
   - `getWallet`: Reads from cache first. If a cache miss occurs, fetches from PostgreSQL via Prisma, serializes `BigInt` balances to strings, and populates Redis with a 60-second TTL.
   - **Invalidation**: Cache is automatically purged upon `deposit`, `withdraw`, and `transfer` operations.

---

## 4. Socket.IO Real-Time Engine (`server/src/lib/socket.js`)

### Authentication & Room Management
- **JWT Verification**: Every WebSocket connection performs a handshake validating the user's JWT token. Unauthenticated requests are rejected.
- **Private Rooms**: On successful connection, the socket automatically joins `user:${userId}`, isolating user data.
- **Monitoring Channel**: Admins and analytical dashboards can join `fraud:monitoring` to observe real-time platform risk telemetry.

### Dispatched Real-Time Events
| Event Name | Recipient | Payload Details |
|---|---|---|
| `BALANCE_UPDATED` | `user:${userId}` | `{ userId, balance, timestamp }` |
| `TRANSACTION_CREATED` | `user:${senderId}` & `user:${receiverId}` | `{ transaction: { id, amount, type, status, description, createdAt }, role: "SENDER" \| "RECEIVER", timestamp }` |
| `FRAUD_ALERT` | `user:${userId}` & `fraud:monitoring` | `{ userId, transactionId, amount, riskScore, decision, reasons, ruleScore, ml, timestamp }` |

---

## 5. Controller Integrations (`walletController.js`)
- **`deposit`**:
  - Updates DB wallet balance and creates transaction record.
  - Invalidates `wallet:${userId}` cache.
  - Dispatches `BALANCE_UPDATED` to user's private room.
  - Dispatches `TRANSACTION_CREATED` to user.
- **`withdraw`**:
  - Validates balance, updates DB, creates transaction record.
  - Invalidates `wallet:${userId}` cache.
  - Dispatches `BALANCE_UPDATED` and `TRANSACTION_CREATED`.
- **`transfer`**:
  - Evaluates hybrid fraud risk (Rule Engine + Machine Learning model).
  - **If BLOCKED**: Creates blocked transaction record and dispatches real-time `FRAUD_ALERT` to the sender and `fraud:monitoring` room.
  - **If APPROVED / FLAGGED / REVIEW**: Executes atomic DB balance transfer, invalidates caches for both sender and receiver, dispatches `BALANCE_UPDATED` to both parties, dispatches `TRANSACTION_CREATED` to both parties, and if marked `FLAGGED` or `REVIEW`, also broadcasts a `FRAUD_ALERT`.

---

## 6. Automated Test Suite Verification (`testRealtime.js`)
Executed `node src/services/testRealtime.js`:
- ✅ **Cache Operations**: Set, Get, Invalidation, and Increment verified.
- ✅ **Pub/Sub Messaging**: Inter-component event dispatching verified.
- ✅ **Security**: Rejected unauthenticated socket connection without valid JWT token.
- ✅ **Authentication**: Authorized client connection with signed JWT verified.
- ✅ **Private Room Joining**: Automatic routing to `user:${userId}` verified.
- ✅ **Real-Time Events**: Verified delivery of `BALANCE_UPDATED`, `TRANSACTION_CREATED`, and `FRAUD_ALERT`.
- ✅ **Offline Resilience**: Verified zero-downtime execution in standalone in-memory mode.

---

## 7. Next Roadmap Milestone
- **Phase 7 — React Desktop UI**:
  - Build dashboard, wallet, deposits, withdrawals, transfers, transaction history, real-time fraud alerts, and analytics screens using React, Vite, Tailwind CSS, Recharts, and Socket.IO client.
